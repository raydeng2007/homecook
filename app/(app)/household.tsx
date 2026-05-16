import {
  View, Text, Pressable, Switch, FlatList, TextInput, Modal, Alert,
  ActivityIndicator, Share, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/contexts/AuthContext';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import { signOut } from '@/lib/auth';
import {
  getHomeMembers,
  updateHomeName,
  removeMember,
  updateMemberRole,
  joinHomeByCode,
  regenerateInviteCode,
  leaveHome,
  deleteAccount,
} from '@/lib/homes';
import type { HomeMember } from '@/types/database';

export default function HouseholdScreen() {
  const { session } = useAuth();
  const { home, refresh: refreshHome } = useHome();
  const { isDark, toggleTheme } = useTheme();
  const { primary, textHigh, textMedium, textDisabled, onPrimary, statusBarStyle, secondary, error: errorColor, primaryVariant } = useThemeColors();

  const [members, setMembers] = useState<HomeMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [homeName, setHomeName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  // Invite code state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Join modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const currentUserId = session?.user?.id;

  const loadMembers = useCallback(async () => {
    if (!home?.id) return;
    try {
      setIsLoading(true);
      const data = await getHomeMembers(home.id);
      setMembers(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load household members. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [home?.id]);

  // Reload members whenever home.id changes (handles join/leave)
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (home?.name) setHomeName(home.name);
  }, [home?.name]);

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === 'owner';

  // ── Name editing ──

  const handleSaveName = async () => {
    if (!home?.id || !homeName.trim()) return;
    try {
      setIsSavingName(true);
      await updateHomeName(home.id, homeName.trim());
      await refreshHome();
      setIsEditingName(false);
    } catch (err) {
      Alert.alert('Error', 'Failed to save household name. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  // ── Member management ──

  const handleToggleRole = async (member: HomeMember) => {
    if (!isOwner || member.user_id === currentUserId) return;
    const newRole = member.role === 'owner' ? 'member' : 'owner';
    try {
      await updateMemberRole(member.id, newRole);
      loadMembers();
    } catch (err) {
      Alert.alert('Error', 'Failed to update member role. Please try again.');
    }
  };

  const handleRemoveMember = (member: HomeMember) => {
    if (!isOwner || member.user_id === currentUserId) return;
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from your household?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(member.id);
              loadMembers();
            } catch (err) {
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            }
          },
        },
      ]
    );
  };

  // ── Invite code actions ──

  const handleCopyCode = async () => {
    if (!home?.invite_code) return;
    await Clipboard.setStringAsync(home.invite_code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleShareCode = async () => {
    if (!home?.invite_code || !home?.name) return;
    try {
      await Share.share({
        message: `Join my household "${home.name}" on HomeCook! Use invite code: ${home.invite_code}`,
      });
    } catch (err) {
      // Share cancelled or failed — no action needed
    }
  };

  const handleRegenerateCode = () => {
    if (!home?.id) return;
    Alert.alert(
      'Regenerate Code',
      'This will invalidate the current invite code. Anyone with the old code won\'t be able to join.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            try {
              setIsRegenerating(true);
              await regenerateInviteCode(home.id);
              await refreshHome();
            } catch (err) {
              Alert.alert('Error', 'Failed to regenerate invite code');
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ]
    );
  };

  // ── Join household ──

  const formatJoinCode = (text: string) => {
    // Strip non-alphanumeric, uppercase, insert dash after 4 chars
    const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
    if (clean.length > 4) {
      return clean.slice(0, 4) + '-' + clean.slice(4);
    }
    return clean;
  };

  const handleJoinCodeChange = (text: string) => {
    setJoinCode(formatJoinCode(text));
    setJoinError('');
  };

  const handleJoinSubmit = async () => {
    if (!currentUserId || joinCode.length < 9) {
      setJoinError('Please enter a complete invite code');
      return;
    }

    try {
      setIsJoining(true);
      setJoinError('');
      await joinHomeByCode(currentUserId, joinCode);
      await refreshHome();
      setShowJoinModal(false);
      setJoinCode('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join';
      if (message.includes('Invalid invite code')) {
        setJoinError('Invalid invite code. Please check and try again.');
      } else {
        setJoinError(message);
      }
    } finally {
      setIsJoining(false);
    }
  };

  // ── Leave household ──

  const handleLeaveHome = () => {
    if (!currentUserId) return;
    Alert.alert(
      'Leave Household',
      'You will be removed from this household and a new personal home will be created for you. Your bookmarked recipes will stay with you.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHome(currentUserId);
              await refreshHome();
            } catch (err) {
              Alert.alert('Error', 'Failed to leave household');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUserId) return;
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data, including recipes, meal plans, and bookmarks. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation for extra safety
            Alert.alert(
              'Are you sure?',
              'This action is permanent. All your data will be lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteAccount(currentUserId);
                      await signOut();
                    } catch (err) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshHome();
      await loadMembers();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshHome, loadMembers]);

  const memberCount = members.length;

  return (
    <View className="screen">
      <StatusBar style={statusBarStyle} />

      {/* Header */}
      <View className="px-5 pt-14 pb-4 bg-surface-1 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-text-high">Household</Text>
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-3 active:bg-surface-5"
        >
          <Ionicons name="log-out-outline" size={14} color={textMedium} />
          <Text className="text-sm text-text-medium">Sign Out</Text>
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primary}
            colors={[primary]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Home name card */}
            <View className="px-5 pt-4">
              <View className="card">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 rounded-xl bg-primary/20 items-center justify-center">
                      <Ionicons name="home" size={20} color={primary} />
                    </View>
                    {isEditingName ? (
                      <View className="flex-1 flex-row items-center gap-2">
                        <TextInput
                          value={homeName}
                          onChangeText={setHomeName}
                          testID="household-name-input"
                          className="flex-1 bg-surface-2 rounded-lg px-3 py-2 text-text-high text-sm"
                          autoFocus
                          onSubmitEditing={handleSaveName}
                        />
                        <Pressable
                          onPress={handleSaveName}
                          disabled={isSavingName}
                          className="px-3 py-2 rounded-lg bg-primary active:bg-primary-variant"
                        >
                          {isSavingName ? (
                            <ActivityIndicator size="small" color={onPrimary} />
                          ) : (
                            <Text className="text-on-primary text-xs font-bold">Save</Text>
                          )}
                        </Pressable>
                      </View>
                    ) : (
                      <View className="flex-1">
                        <Text className="text-text-high font-semibold text-base">
                          {home?.name ?? 'My Home'}
                        </Text>
                        <Text className="text-text-disabled text-xs mt-0.5">
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                  {!isEditingName && isOwner && (
                    <Pressable
                      onPress={() => setIsEditingName(true)}
                      className="w-8 h-8 items-center justify-center rounded-full active:bg-surface-3"
                    >
                      <Ionicons name="pencil" size={16} color={textMedium} />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Invite code card */}
            <View className="px-5 pt-4">
              <View className="card">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="key-outline" size={16} color={primary} />
                  <Text className="text-text-medium text-xs font-medium uppercase tracking-wider">
                    Invite Code
                  </Text>
                </View>

                {/* Code display */}
                <View className="bg-surface-2 rounded-xl px-4 py-3 items-center mb-3">
                  {isRegenerating ? (
                    <ActivityIndicator size="small" color={primary} />
                  ) : (
                    <Text
                      testID="household-invite-code"
                      className="text-text-high text-2xl font-bold tracking-[6px]"
                      style={{ fontFamily: 'monospace' }}
                    >
                      {home?.invite_code ?? '----'}
                    </Text>
                  )}
                </View>

                <Text className="text-text-disabled text-xs text-center mb-3">
                  Share this code so others can join your household
                </Text>

                {/* Action buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={handleCopyCode}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary active:bg-primary-variant"
                  >
                    <Ionicons
                      name={codeCopied ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={onPrimary}
                    />
                    <Text className="text-on-primary font-semibold text-sm">
                      {codeCopied ? 'Copied!' : 'Copy'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShareCode}
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-surface-3 active:bg-surface-5"
                  >
                    <Ionicons name="share-outline" size={16} color={textHigh} />
                    <Text className="text-text-high font-semibold text-sm">Share</Text>
                  </Pressable>
                </View>

                {/* Regenerate (owner only) */}
                {isOwner && (
                  <Pressable
                    onPress={handleRegenerateCode}
                    disabled={isRegenerating}
                    className="mt-3 self-center"
                  >
                    <Text className="text-text-disabled text-xs">
                      Regenerate code
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Join a different household */}
            <View className="px-5 pt-3">
              <Pressable
                onPress={() => setShowJoinModal(true)}
                className="card flex-row items-center justify-center gap-2 py-3"
              >
                <Ionicons name="enter-outline" size={18} color={primary} />
                <Text className="text-primary font-medium text-sm">
                  Join a Different Household
                </Text>
              </Pressable>
            </View>

            {/* Members heading */}
            <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
              <Text className="text-xs text-text-disabled font-medium uppercase tracking-wider">
                Members ({memberCount})
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isSelf = item.user_id === currentUserId;
          // BUG FIX: previously non-self members showed literal text "Member"
          // and a truncated UUID. Now we read full_name + email from the
          // get_home_members_with_profiles RPC (migration 011). Fall back to
          // session data for self, or the UUID prefix if neither is available.
          const fallbackName = isSelf
            ? session?.user?.user_metadata?.full_name ?? null
            : null;
          const fallbackEmail = isSelf ? session?.user?.email ?? '' : '';

          const fullName = item.full_name?.trim() || fallbackName;
          const email = item.email || fallbackEmail;

          const displayName = fullName
            ? fullName
            : email
              ? email.split('@')[0]
              : 'Member';
          const displayEmail = email || (isSelf ? '' : item.user_id.substring(0, 8) + '...');
          const initial = displayName[0]?.toUpperCase() ?? 'M';

          return (
            <View className="px-5 mb-2">
              <View className="card flex-row items-center">
                {/* Avatar */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isSelf ? primary : secondary,
                  }}
                >
                  <Text className="text-on-primary font-bold">{initial}</Text>
                </View>

                {/* Info */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-text-high font-semibold text-sm">
                      {displayName}
                      {isSelf ? ' (you)' : ''}
                    </Text>
                  </View>
                  <Text className="text-text-medium text-xs mt-0.5">
                    {displayEmail}
                  </Text>
                </View>

                {/* Role badge */}
                <Pressable
                  onPress={() => !isSelf && isOwner && handleToggleRole(item)}
                  disabled={!isOwner || isSelf}
                >
                  <View
                    className={`px-2.5 py-1 rounded-full ${
                      item.role === 'owner' ? 'bg-primary/20' : 'bg-surface-3'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        item.role === 'owner' ? 'text-primary' : 'text-text-medium'
                      }`}
                    >
                      {item.role === 'owner' ? 'Owner' : 'Member'}
                    </Text>
                  </View>
                </Pressable>

                {/* Remove button (only for owner, not self) */}
                {isOwner && !isSelf && (
                  <Pressable
                    onPress={() => handleRemoveMember(item)}
                    className="ml-2 w-8 h-8 items-center justify-center rounded-full active:bg-error/20"
                  >
                    <Ionicons name="close-circle-outline" size={18} color={errorColor} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View>
            {/* Leave household — non-owners, or solo owners (who would get a fresh home) */}
            {(!isOwner || (isOwner && memberCount === 1)) && memberCount >= 1 && (
              <View className="px-5 pt-3">
                <Pressable
                  onPress={handleLeaveHome}
                  className="card flex-row items-center justify-center gap-2 py-3"
                >
                  <Ionicons name="exit-outline" size={18} color={errorColor} />
                  <Text className="text-error font-medium text-sm">
                    Leave Household
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Settings section */}
            <View className="px-5 pt-5">
              <Text className="text-xs text-text-disabled font-medium uppercase tracking-wider mb-3">
                Preferences
              </Text>

              {/* Theme toggle */}
              <View className="card flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-9 h-9 rounded-xl bg-surface-3 items-center justify-center">
                    <Ionicons
                      name={isDark ? 'moon' : 'sunny'}
                      size={18}
                      color={primary}
                    />
                  </View>
                  <View>
                    <Text className="text-text-high font-medium text-sm">Dark Mode</Text>
                    <Text className="text-text-disabled text-xs">
                      {isDark ? 'Dark theme active' : 'Light theme active'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  testID="household-theme-toggle"
                  trackColor={{ false: '#D4C9BC', true: primaryVariant }}
                  thumbColor={isDark ? primary : '#FAF3EB'}
                />
              </View>
            </View>

            {/* Legal */}
            <View className="px-5 pt-5">
              <Text className="text-xs text-text-disabled font-medium uppercase tracking-wider mb-3">
                Legal
              </Text>
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync('https://homecook.live/privacy.html')}
                className="card flex-row items-center gap-3 py-3 mb-2"
              >
                <Ionicons name="shield-checkmark-outline" size={22} color={primary} />
                <Text className="text-text-high font-medium text-sm flex-1">Privacy Policy</Text>
                <Ionicons name="open-outline" size={14} color={textDisabled} />
              </Pressable>
              <Pressable
                onPress={() => WebBrowser.openBrowserAsync('https://homecook.live/terms.html')}
                className="card flex-row items-center gap-3 py-3"
              >
                <Ionicons name="document-text-outline" size={22} color={primary} />
                <Text className="text-text-high font-medium text-sm flex-1">Terms of Service</Text>
                <Ionicons name="open-outline" size={14} color={textDisabled} />
              </Pressable>
            </View>

            {/* Danger zone */}
            <View className="px-5 pt-5 pb-8">
              <Text className="text-xs text-text-disabled font-medium uppercase tracking-wider mb-3">
                Account
              </Text>
              <Pressable
                onPress={handleDeleteAccount}
                className="card flex-row items-center gap-3 py-3"
              >
                <Ionicons name="trash-outline" size={22} color={errorColor} />
                <View className="flex-1">
                  <Text className="text-error font-medium text-sm">Delete Account</Text>
                  <Text className="text-text-disabled text-xs">
                    Permanently delete your account and data
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={primary} />
            </View>
          ) : null
        }
      />

      {/* Join Household Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View className="flex-1 bg-background">
          {/* Modal header */}
          <View className="px-5 pt-6 pb-4 bg-surface-1 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-text-high">Join a Household</Text>
            <Pressable
              onPress={() => {
                setShowJoinModal(false);
                setJoinCode('');
                setJoinError('');
              }}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-surface-3"
            >
              <Ionicons name="close" size={24} color={textHigh} />
            </Pressable>
          </View>

          <View className="px-5 pt-6">
            {/* Illustration */}
            <View className="items-center mb-6">
              <View className="w-20 h-20 rounded-full bg-primary/15 items-center justify-center mb-4">
                <Ionicons name="people" size={36} color={primary} />
              </View>
              <Text className="text-text-high text-base font-medium text-center">
                Enter an invite code to join
              </Text>
              <Text className="text-text-medium text-sm mt-1 text-center max-w-[280px]">
                Ask the household owner for their invite code. You'll share the same calendar and shopping list.
              </Text>
            </View>

            {/* Code input */}
            <View className="mb-4">
              <Text className="text-text-medium text-xs font-medium uppercase tracking-wider mb-2">
                Invite Code
              </Text>
              <TextInput
                value={joinCode}
                onChangeText={handleJoinCodeChange}
                testID="household-join-input"
                placeholder="XXXX-XXXX"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                className="bg-surface-2 rounded-xl px-4 py-4 text-text-high text-xl font-bold text-center tracking-[6px]"
                style={{ fontFamily: 'monospace' }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={9}
                autoFocus
              />
            </View>

            {/* Error message */}
            {joinError ? (
              <View className="flex-row items-center gap-2 mb-4 px-1">
                <Ionicons name="alert-circle" size={16} color={errorColor} />
                <Text className="text-error text-sm flex-1">{joinError}</Text>
              </View>
            ) : null}

            {/* Warning */}
            <View className="flex-row items-start gap-2 mb-6 px-1">
              <Ionicons name="information-circle-outline" size={16} color={textMedium} />
              <Text className="text-text-medium text-xs flex-1">
                Joining a new household will move you from your current one. Your personal bookmarked recipes will stay with you.
              </Text>
            </View>

            {/* Join button */}
            <Pressable
              onPress={handleJoinSubmit}
              disabled={isJoining || joinCode.length < 9}
              className={`rounded-2xl py-4 flex-row items-center justify-center ${
                joinCode.length >= 9 ? 'bg-primary active:opacity-80' : 'bg-surface-3'
              }`}
            >
              {isJoining ? (
                <ActivityIndicator size="small" color={onPrimary} />
              ) : (
                <>
                  <Ionicons
                    name="enter-outline"
                    size={20}
                    color={joinCode.length >= 9 ? onPrimary : textMedium}
                  />
                  <Text
                    className={`font-bold text-base ml-2 ${
                      joinCode.length >= 9 ? 'text-on-primary' : 'text-text-medium'
                    }`}
                  >
                    Join Household
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
