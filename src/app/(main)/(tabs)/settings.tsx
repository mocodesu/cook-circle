// ─────────────────────────────────────────────────────────────
// app/(main)/(tabs)/settings.tsx
// ─────────────────────────────────────────────────────────────
import Text from "@/components/text";
import { useSync } from "@/hooks/use-sync";
import { SyncEngine } from "@/repositories/sync-engine";
import {
  registerBackgroundSync,
  unregisterBackgroundSync,
} from "@/tasks/background-sync";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvex, useConvexAuth } from "convex/react";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type SignInStep = "email" | "code";

export default function SettingsScreen() {
  const { theme } = useUnistyles();
  const db = useSQLiteContext();

  const {
    enabled,
    setEnabled,
    pending,
    lastSyncAt,
    lastError,
    hydrated,
    refresh,
  } = useSync();

  const convex = useConvex();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // ── Modal state ────────────────────────────────────────
  const [showSignIn, setShowSignIn] = useState(false);
  const [step, setStep] = useState<SignInStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // ── Run sync (requires auth) ───────────────────────────
  const runSync = useCallback(async () => {
    if (!isAuthenticated) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await SyncEngine.run(db, convex);
      if ("error" in res && res.error) setSyncError(res.error);
    } catch (err: any) {
      setSyncError(err?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
      await refresh();
    }
  }, [db, convex, isAuthenticated, refresh]);

  // ── Reset modal ────────────────────────────────────────
  const resetModal = () => {
    setShowSignIn(false);
    setStep("email");
    setEmail("");
    setCode("");
    setAuthError(null);
  };

  // ── Toggle ─────────────────────────────────────────────
  const handleToggle = async (next: boolean) => {
    await setEnabled(next);

    // Register/unregister the OS background task
    try {
      if (next) {
        await registerBackgroundSync();
      } else {
        await unregisterBackgroundSync();
      }
    } catch (err) {
      console.warn("[settings] background task toggle failed:", err);
    }

    // Prompt sign-in if enabling without an account
    if (next && !isAuthenticated) {
      setShowSignIn(true);
    }
  };

  // ── Step 1: send code ──────────────────────────────────
  const handleSendCode = async () => {
    if (!email.trim()) return;
    setSending(true);
    setAuthError(null);
    try {
      await signIn("email", { email: email.trim() });
      setStep("code");
    } catch (err: any) {
      setAuthError(err?.message ?? "Couldn't send the code. Try again.");
    } finally {
      setSending(false);
    }
  };

  // ── Step 2: verify code ────────────────────────────────
  const handleVerify = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    setAuthError(null);
    try {
      await signIn("email", { email: email.trim(), code: code.trim() });
      resetModal();
      // Give Convex Auth a beat to propagate, then run an initial sync
      setTimeout(() => runSync(), 500);
    } catch (err: any) {
      setAuthError(err?.message ?? "That code didn't work. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  // ── Sign out ───────────────────────────────────────────
  const handleSignOut = async () => {
    Alert.alert("Sign out?", "Local recipes stay on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          await refresh();
        },
      },
    ]);
  };

  // ── Status label ───────────────────────────────────────
  const statusLabel = (() => {
    if (!enabled) return "Your recipes stay on this device only.";
    if (authLoading) return "Checking account…";
    if (!isAuthenticated) return "Sign in to start backing up.";
    if (syncing) return "Syncing…";
    if (lastSyncAt)
      return `Last synced ${new Date(lastSyncAt).toLocaleString()}`;
    return "Waiting for first sync";
  })();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text variant="h2" color="onBackground">
        Settings
      </Text>

      {/* ── Back up & sync ───────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text variant="title" color="onSurface">
              Back up & sync
            </Text>
            <Text variant="footnote" color="mutedText">
              {statusLabel}
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            disabled={!hydrated}
            trackColor={{
              false: theme.colors.panelBorder,
              true: theme.colors.primary,
            }}
            thumbColor={theme.colors.surface}
          />
        </View>

        {enabled && pending > 0 && (
          <Text variant="caption" color="mutedText">
            {pending} {pending === 1 ? "change" : "changes"} waiting to sync
          </Text>
        )}

        {(syncError || lastError) && (
          <Text variant="caption" color="danger">
            {syncError ?? lastError}
          </Text>
        )}
      </View>

      {/* ── Account ──────────────────────────────────────── */}
      {enabled && !authLoading && (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text variant="title" color="onSurface">
                Account
              </Text>
              <Text variant="footnote" color="mutedText">
                {isAuthenticated
                  ? "Signed in — recipes sync across your devices."
                  : "Not signed in. Backups stay queued on this device."}
              </Text>
            </View>
            <Pressable
              onPress={
                isAuthenticated ? handleSignOut : () => setShowSignIn(true)
              }
              hitSlop={12}
              style={({ pressed }) => [
                styles.textButton,
                pressed && styles.pressed,
              ]}
            >
              <Text
                variant="subheadBold"
                color={isAuthenticated ? "danger" : "primary"}
              >
                {isAuthenticated ? "Sign out" : "Sign in"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Manual sync ──────────────────────────────────── */}
      {enabled && isAuthenticated && (
        <Pressable
          onPress={runSync}
          disabled={syncing}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.pressed,
            syncing && styles.disabled,
          ]}
        >
          <Text variant="title" color="onPrimary">
            {syncing ? "Syncing…" : "Sync now"}
          </Text>
        </Pressable>
      )}

      {/* ── Sign-in modal ────────────────────────────────── */}
      <Modal
        visible={showSignIn}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={resetModal}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={resetModal}
              hitSlop={12}
              style={styles.modalClose}
            >
              <Text variant="body" color="primary">
                Cancel
              </Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            {step === "email" ? (
              <>
                <Text variant="h2" color="onBackground">
                  Back up your recipes
                </Text>
                <Text variant="callout" color="mutedText">
                  Enter your email. We'll send a code you can use to sign in.
                </Text>

                <View style={styles.field}>
                  <Text
                    variant="micro"
                    color="mutedText"
                    textTransform="uppercase"
                  >
                    Email
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    editable={!sending}
                    style={styles.input}
                  />
                </View>

                {authError && (
                  <Text variant="caption" color="danger">
                    {authError}
                  </Text>
                )}

                <Pressable
                  onPress={handleSendCode}
                  disabled={sending || !email.trim()}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                    (sending || !email.trim()) && styles.disabled,
                  ]}
                >
                  <Text variant="title" color="onPrimary">
                    {sending ? "Sending…" : "Send code"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text variant="h2" color="onBackground">
                  Enter your code
                </Text>
                <Text variant="callout" color="mutedText">
                  We sent an 8-digit code to {email}. It expires in 15 minutes.
                </Text>

                <View style={styles.field}>
                  <Text
                    variant="micro"
                    color="mutedText"
                    textTransform="uppercase"
                  >
                    Code
                  </Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="00000000"
                    placeholderTextColor={theme.colors.mutedText}
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={8}
                    editable={!verifying}
                    style={[styles.input, styles.codeInput]}
                  />
                </View>

                {authError && (
                  <Text variant="caption" color="danger">
                    {authError}
                  </Text>
                )}

                <Pressable
                  onPress={handleVerify}
                  disabled={verifying || code.trim().length < 6}
                  style={({ pressed }) => [
                    styles.button,
                    pressed && styles.pressed,
                    (verifying || code.trim().length < 6) && styles.disabled,
                  ]}
                >
                  <Text variant="title" color="onPrimary">
                    {verifying ? "Verifying…" : "Sign in"}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setStep("email");
                    setCode("");
                    setAuthError(null);
                  }}
                  hitSlop={8}
                  style={styles.textButton}
                >
                  <Text variant="subheadBold" color="primary">
                    Use a different email
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.giant,
    gap: theme.spacing.lg,
  },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  rowText: { flex: 1, gap: theme.spacing.xxs },
  textButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.sm,
  },
  pressed: { opacity: theme.opacity.pressed },
  disabled: { opacity: theme.opacity.disabled },

  // ── Modal ─────────────────────────────────────────────
  modalRoot: { flex: 1, backgroundColor: theme.colors.background },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  modalClose: { padding: theme.spacing.xs },
  modalBody: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.lg,
  },
  field: { gap: theme.spacing.xxs },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: theme.borderWidth.thin,
    borderColor: theme.colors.panelBorder,
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.onSurface,
    minHeight: 44,
  },
  codeInput: {
    letterSpacing: 6,
    fontSize: 22,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
}));
