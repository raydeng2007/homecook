import { View, Text, Pressable, Switch, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useHome } from '@/contexts/HomeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { signOut } from '@/lib/auth';
import { getHomeMembers, updateHomeName, removeMember, updateMemberRole } from '@/lib/homes';
import type { HomeMember } from '@/types/database';

export default function HouseholdScreen() {
  const { session } = useAuth();
  const { home, refresh: refreshHome } = useHome();
  const { isDark, toggleTheme } = useTheme();

  const [members, setMembers] = useState<HomeMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [homeName, setHomeName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

  const currentUserId = session?.user?.id;

  const loadMembers = useCallback(async () => {
    if (!home?.id) return;
    try {
      setIsLoading(true);
      const data = await getHomeMembers(home.id);
      setMembers(data);
    } catch (err) {
      console.error('[Household] Failed to load members:', err);
    } finally {
      setIsLoading(false);
    }
  }, [home?.id]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (home?.name) setHomeName(home.name);
  }, [home?.name]);

  const currentMember = members.find((m) => m.user_id === currentUserId);
  const isOwner = currentMember?.role === 'owner';

  const handleSaveName = async () => {
    if (!home?.id || !homeName.trim()) return;
    try {
      setIsSavingName(true);
      await updateHomeName(home.id, homeName.trim());
      await refreshHome();
      setIsEditingName(false);
    } catch (err) {
      console.error('[Household] Failed to update name:', err);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleToggleRole = async (member: HomeMember) => {
    if (!isOwner || member.user_id === currentUserId) return;
    const newRole = member.role === 'owner' ? 'member' : 'owner';
    try {
      await updateMemberRole(member.id, newRole);
      loadMembers();
    } catch (err) {
      console.error('[Household] Failed to update role:', err);
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
              console.error('[Household] Failed to remove member:', err);
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
      console.error('Sign out failed:', error);
    }
  };

  const memberCount = members.length;

  return (
    <View className="screen">
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View className="px-5 pt-14 pb-4 bg-surface-1 flex-row justify-between items-center">
        <Text className="text-xl font-bold text-text-high">Household</Text>
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full bg-surface-3 active:bg-surface-5"
        >
          <Ionicons
            name="log-out-outline"
            size={14}
            color={isDark ? 'rgba(255,255,255,0.60)' : 'rgba(0,0,0,0.60)'}
          />
          <Text className="text-sm text-text-medium">Sign Out</Text>
        </Pressable>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View>
            {/* Home name card */}
            <View className="px-5 pt-4">
              <View className="card">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3 flex-1">
                    <View className="w-11 h-11 rounded-xl bg-primary/20 items-center justify-center">
                      <Ionicons name="home" size={20} color="#BB86FC" />
                    </View>
                    {isEditingName ? (
                      <View className="flex-1 flex-row items-center gap-2">
                        <TextInput
                          value={homeName}
                          onChangeText={setHomeName}
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
                            <ActivityIndicator size="small" color="#000" />
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
                      <Ionicons name="pencil" size={16} color="rgba(255,255,255,0.60)" />
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Members heading */}
            <View className="px-5 pt-5 pb-2 flex-row items-center justify-between">
              <Text className="text-xs text-text-disabled font-medium uppercase tracking-wider">
                Members
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const isSelf = item.user_id === currentUserId;
          const displayName = isSelf
            ? session?.user?.user_metadata?.full_name ?? 'You'
            : `Member`;
          const displayEmail = isSelf
            ? session?.user?.email ?? ''
            : item.user_id.substring(0, 8) + '...';
          const initial = displayName[0]?.toUpperCase() ?? 'M';

          return (
            <View className="px-5 mb-2">
              <View className="card flex-row items-center">
                {/* Avatar */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isSelf ? '#BB86FC' : '#03DAC6',
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
                    <Ionicons name="close-circle-outline" size={18} color="#CF6679" />
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View>
            {/* Invite section */}
            <View className="px-5 pt-3 pb-2">
              <View className="card items-center py-6">
                <View className="w-14 h-14 rounded-full bg-surface-2 items-center justify-center mb-3">
                  <Ionicons
                    name="person-add-outline"
                    size={24}
                    color={isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)'}
                  />
                </View>
                <Text className="text-text-medium text-sm text-center">
                  Invite members to your household
                </Text>
                <Text className="text-text-disabled text-xs mt-1 text-center max-w-[240px]">
                  Share recipes and plan meals together
                </Text>
                <Pressable className="mt-4 flex-row items-center gap-2 px-5 py-2.5 rounded-full border border-primary active:bg-surface-3">
                  <Ionicons name="mail-outline" size={16} color="#BB86FC" />
                  <Text className="text-primary font-medium text-sm">Send Invite</Text>
                </Pressable>
              </View>
            </View>

            {/* Settings section */}
            <View className="px-5 pt-4">
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
                      color="#BB86FC"
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
                  trackColor={{ false: '#E0E0E0', true: '#3700B3' }}
                  thumbColor={isDark ? '#BB86FC' : '#FAFAFA'}
                />
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color="#BB86FC" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
