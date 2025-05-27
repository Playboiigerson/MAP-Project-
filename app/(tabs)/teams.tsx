import { StyleSheet, Alert, ActivityIndicator, TextInput, TouchableOpacity, ScrollView, Animated, View, Text, Modal, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Team } from '@/services/supabaseRest';
import { teamService, playerService } from '@/services/supabaseRest';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Simple icon component using SF Symbols naming convention
const IconSymbol = ({ name, size, color }: { name: string, size: number, color: string }) => {
  // Map SF Symbol names to Ionicons
  const iconMap: {[key: string]: string} = {
    'plus': 'add',
    'xmark': 'close',
    'xmark.circle.fill': 'close-circle',
    'magnifyingglass': 'search',
    'pencil': 'pencil',
    'pencil.circle.fill': 'create',
    'plus.circle.fill': 'add-circle',
    'trash': 'trash',
    'person.fill': 'person',
    'person.3.fill': 'people',
    'person.3.sequence.fill': 'people',
    'person.badge.plus': 'person-add'
  };

  const ionIconName = iconMap[name] || 'help-circle';
  
  return (
    <Ionicons name={ionIconName as any} size={size} color={color} />
  );
};

// Team detail modal component
const TeamDetailModal = ({ team, visible, onClose }: { team: Team | null, visible: boolean, onClose: () => void }) => {
  const colorScheme = useColorScheme();
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (team && visible) {
      loadTeamPlayers(team.id!);
    }
  }, [team, visible]);

  const loadTeamPlayers = async (teamId: string) => {
    setLoading(true);
    try {
      const teamPlayers = await playerService.getPlayersByTeam(teamId);
      setPlayers(teamPlayers);
    } catch (error) {
      console.error('Error loading team players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true
    }).start(() => onClose());
  };

  if (!team) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0]
  });

  // Generate a random team color based on team name for visual interest
  const getTeamColor = (name: string) => {
    const colors = [
      Colors[colorScheme ?? 'light'].primary,
      Colors[colorScheme ?? 'light'].secondary,
      Colors[colorScheme ?? 'light'].accent,
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const teamColor = getTeamColor(team.name);

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent, 
            { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              transform: [{ translateY }] 
            }
          ]}
        >
          {/* Team header with color accent */}
          <View style={[styles.teamHeaderBanner, { backgroundColor: teamColor }]}>
            <View style={styles.teamLogoPlaceholder}>
              <Text style={styles.teamInitials}>{team.name.substring(0, 2).toUpperCase()}</Text>
            </View>
            <Text style={styles.modalTitle}>{team.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <IconSymbol name="xmark.circle.fill" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Team stats cards */}
            <View style={styles.teamStatsContainer}>
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: teamColor }]}>{team.division}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Division</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: teamColor }]}>{players.length}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Players</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: teamColor }]}>{team.coach}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Coach</Text>
              </View>
            </View>

            {/* Team roster section */}
            <View style={styles.rosterSection}>
              <View style={styles.sectionHeaderRow}>
                <IconSymbol name="person.3.fill" size={20} color={teamColor} />
                <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Team Roster</Text>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={teamColor} />
                </View>
              ) : (
                <View style={styles.playersListContainer}>
                  {players.length > 0 ? (
                    <FlatList
                      data={players}
                      keyExtractor={(item, index) => item.id || index.toString()}
                      renderItem={({ item: player }) => (
                        <View style={[styles.playerCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                          <View style={[styles.playerIconContainer, { backgroundColor: teamColor }]}>
                            <Text style={styles.playerInitials}>
                              {player.name.split(' ').map((n: string) => n[0]).join('')}
                            </Text>
                          </View>
                          <View style={styles.playerInfo}>
                            <Text style={[styles.playerName, { color: Colors[colorScheme ?? 'light'].text }]}>
                              {player.name}
                            </Text>
                            <Text style={[styles.playerPosition, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                              {player.position}
                            </Text>
                          </View>
                        </View>
                      )}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={styles.playersList}
                    />
                  ) : (
                    <View style={[styles.emptyStateContainer, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                      <IconSymbol name="person.badge.plus" size={40} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                      <Text style={[styles.noPlayersText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        No players registered for this team yet
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.closeModalButton, { backgroundColor: teamColor }]}
              onPress={handleClose}
            >
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function TeamsScreen() {
  const colorScheme = useColorScheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newTeam, setNewTeam] = useState({ id: '', name: '', division: '', coach: '' });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'premier', 'division1', etc.
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Division options for dropdown and filtering
  const divisions = ["Premier", "Division 1", "Division 2", "Junior League", "Women's League"];
  const divisionTabs = [
    { id: 'all', label: 'All Teams' },
    { id: 'premier', label: 'Premier' },
    { id: 'division1', label: 'Division 1' },
    { id: 'division2', label: 'Division 2' },
    { id: 'junior', label: 'Junior' },
    { id: 'women', label: 'Women' },
  ];
  
  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // Load teams from Supabase on component mount
  useEffect(() => {
    loadTeams();
  }, []);
  
  const loadTeams = async () => {
    setLoading(true);
    try {
      const teamsData = await teamService.getTeams();
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
      Alert.alert('Error', 'Failed to load teams. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Filter teams based on search query and active tab
  const getFilteredTeams = () => {
    let filtered = teams;
    
    // First filter by division tab
    if (activeTab !== 'all') {
      const tabToDivisionMap: {[key: string]: string} = {
        'premier': 'Premier',
        'division1': 'Division 1',
        'division2': 'Division 2',
        'junior': 'Junior League',
        'women': "Women's League",
      };
      
      filtered = filtered.filter(team => 
        team.division === tabToDivisionMap[activeTab]
      );
    }
    
    // Then filter by search query
    if (searchQuery) {
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.coach.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const filteredTeams = getFilteredTeams();
  
  const handleViewTeamDetails = (team: Team) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTeam(team);
    setModalVisible(true);
  };
  
  const handleEditTeam = (team: Team) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNewTeam({
      id: team.id || '',
      name: team.name,
      division: team.division,
      coach: team.coach
    });
    setIsEditing(true);
    setShowRegistrationForm(true);
  };
  
  const handleDeleteTeam = async (teamId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this team? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await teamService.deleteTeam(teamId);
              if (success) {
                // Remove from local state
                setTeams(teams.filter(team => team.id !== teamId));
                Alert.alert('Success', 'Team has been deleted successfully.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Error', 'Failed to delete team. Please try again.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            } catch (error) {
              console.error('Error deleting team:', error);
              Alert.alert('Error', 'An unexpected error occurred while deleting the team.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRegisterTeam = async () => {
    if (!newTeam.name || !newTeam.division || !newTeam.coach) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      if (isEditing && newTeam.id) {
        // Update existing team
        const updatedTeam = await teamService.updateTeam(newTeam.id, {
          name: newTeam.name,
          division: newTeam.division,
          coach: newTeam.coach,
        });

        if (updatedTeam) {
          // Update in local state
          setTeams(teams.map(team => team.id === newTeam.id ? updatedTeam : team));
          setNewTeam({ id: '', name: '', division: '', coach: '' });
          setShowRegistrationForm(false);
          setIsEditing(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', `Team ${newTeam.name} has been updated successfully!`);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', 'Failed to update team. Please try again.');
        }
      } else {
        // Create new team
        const createdTeam = await teamService.createTeam({
          name: newTeam.name,
          division: newTeam.division,
          coach: newTeam.coach,
        });

        if (createdTeam) {
          // Update local state
          setTeams([...teams, createdTeam]);
          setNewTeam({ id: '', name: '', division: '', coach: '' });
          setShowRegistrationForm(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', `Team ${newTeam.name} has been registered successfully!`);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Error', 'Failed to register team. Please try again.');
        }
      }
    } catch (error) {
      console.error(isEditing ? 'Error updating team:' : 'Error registering team:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate a random team color based on team name for visual interest
  const getTeamColor = (name: string) => {
    const colors = [
      Colors[colorScheme ?? 'light'].primary,
      Colors[colorScheme ?? 'light'].secondary,
      Colors[colorScheme ?? 'light'].accent,
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.header, 
          { 
            opacity: headerOpacity,
            backgroundColor: Colors[colorScheme ?? 'light'].primary,
            transform: [{ translateY: Animated.multiply(scrollY, -0.1) }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Hockey Teams</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (showRegistrationForm) {
                // Reset form when canceling
                setNewTeam({ id: '', name: '', division: '', coach: '' });
                setIsEditing(false);
              }
              setShowRegistrationForm(!showRegistrationForm);
            }}
          >
            <IconSymbol 
              name={showRegistrationForm ? "xmark" : "plus"} 
              size={24} 
              color={Colors[colorScheme ?? 'light'].primary} 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputContainer, { 
            backgroundColor: Colors[colorScheme ?? 'light'].card,
            borderColor: Colors[colorScheme ?? 'light'].border
          }]}>
            <IconSymbol size={20} name="magnifyingglass" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Search teams..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol size={18} name="xmark.circle.fill" color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Division Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContentContainer}
        >
          {divisionTabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && { backgroundColor: Colors[colorScheme ?? 'light'].primary }
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
            >
              <Text 
                style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? 'white' : Colors[colorScheme ?? 'light'].text }
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Registration Form */}
        {showRegistrationForm && (
          <View style={[styles.registrationForm, { 
            backgroundColor: Colors[colorScheme ?? 'light'].card,
            borderColor: Colors[colorScheme ?? 'light'].border
          }]}>
            <View style={styles.formHeader}>
              <IconSymbol 
                name={isEditing ? "pencil.circle.fill" : "plus.circle.fill"} 
                size={24} 
                color={Colors[colorScheme ?? 'light'].primary} 
              />
              <Text style={[styles.formTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {isEditing ? 'Edit Team' : 'Register New Team'}
              </Text>
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Team Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  color: Colors[colorScheme ?? 'light'].text 
                }]}
                placeholder="Enter team name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={newTeam.name}
                onChangeText={(text) => setNewTeam({...newTeam, name: text})}
              />
            </View>
              
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Division</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formOptionsContainer}>
                {divisions.map((division) => (
                  <TouchableOpacity
                    key={division}
                    style={[
                      styles.divisionOption,
                      { 
                        backgroundColor: newTeam.division === division 
                          ? Colors[colorScheme ?? 'light'].primary 
                          : Colors[colorScheme ?? 'light'].inputBackground
                      }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewTeam({ ...newTeam, division });
                    }}
                  >
                    <Text style={[
                      styles.divisionOptionText, 
                      { 
                        color: newTeam.division === division 
                          ? 'white' 
                          : Colors[colorScheme ?? 'light'].text 
                      }
                    ]}>
                      {division}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.formField}>
              <Text style={[styles.fieldLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Coach Name</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: Colors[colorScheme ?? 'light'].inputBackground,
                  color: Colors[colorScheme ?? 'light'].text 
                }]}
                placeholder="Enter coach name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={newTeam.coach}
                onChangeText={(text) => setNewTeam({...newTeam, coach: text})}
              />
            </View>
            
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.formButton, styles.cancelButton, { borderColor: Colors[colorScheme ?? 'light'].border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowRegistrationForm(false);
                  setNewTeam({ id: '', name: '', division: '', coach: '' });
                  setIsEditing(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.formButton, styles.submitButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  handleRegisterTeam();
                }}
              >
                <Text style={styles.submitButtonText}>{isEditing ? 'Update Team' : 'Register Team'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Teams List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].primary} />
            <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>Loading teams...</Text>
          </View>
        ) : filteredTeams.length > 0 ? (
          <View style={styles.teamsGrid}>
            {filteredTeams.map(team => {
              const teamColor = getTeamColor(team.name);
              return (
                <TouchableOpacity 
                  key={team.id} 
                  style={[styles.teamCard, { 
                    backgroundColor: Colors[colorScheme ?? 'light'].card,
                    borderColor: Colors[colorScheme ?? 'light'].border
                  }]}
                  onPress={() => handleViewTeamDetails(team)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.teamColorBar, { backgroundColor: teamColor }]} />
                  <View style={styles.teamLogoContainer}>
                    <View style={[styles.teamLogo, { backgroundColor: teamColor }]}>
                      <Text style={styles.teamInitials}>
                        {team.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.teamInfo}>
                    <Text style={[styles.teamName, { color: Colors[colorScheme ?? 'light'].text }]} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <View style={styles.teamDetailRow}>
                      <IconSymbol name="person.fill" size={12} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                      <Text style={[styles.teamDetailText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        {team.coach}
                      </Text>
                    </View>
                    <View style={styles.teamDetailRow}>
                      <IconSymbol name="person.3.fill" size={12} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
                      <Text style={[styles.teamDetailText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        {team.players_count || 0} Players
                      </Text>
                    </View>
                    <View style={[styles.divisionBadge, { backgroundColor: teamColor }]}>
                      <Text style={styles.divisionText}>{team.division}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.teamActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.editButton, { backgroundColor: Colors[colorScheme ?? 'light'].highlight }]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditTeam(team);
                      }}
                    >
                      <IconSymbol name="pencil" size={16} color={Colors[colorScheme ?? 'light'].primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteTeam(team.id!);
                      }}
                    >
                      <IconSymbol name="trash" size={16} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <IconSymbol 
              name="person.3.sequence.fill" 
              size={64} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault} 
            />
            <Text style={[styles.emptyStateTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {searchQuery ? 'No teams match your search' : 'No teams available yet'}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {searchQuery 
                ? 'Try a different search term or clear the filter' 
                : 'Register your first team to get started'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: Colors[colorScheme ?? 'light'].primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowRegistrationForm(true);
                }}
              >
                <Text style={styles.emptyStateButtonText}>Register First Team</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.ScrollView>
      
      {/* Team Detail Modal */}
      <TeamDetailModal 
        team={selectedTeam} 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 15,
    padding: 0,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 15,
    flex: 1,
  },
  closeButton: {
    padding: 10,
  },
  closeModalButton: {
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Team modal header
  teamHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  teamLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInitials: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  
  // Modal body
  modalBody: {
    padding: 15,
  },
  teamStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Roster section
  rosterSection: {
    marginTop: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  playersListContainer: {
    marginTop: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitials: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  playerPosition: {
    fontSize: 14,
    marginTop: 2,
  },
  playersList: {
    paddingVertical: 10,
  },
  noPlayersText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  modalEmptyStateContainer: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Header
  header: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    height: 120, // Fixed height instead of animated height
  },
  headerContent: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    height: 45,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  
  // Teams grid
  teamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  teamCard: {
    width: '48%',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  teamColorBar: {
    height: 6,
    width: '100%',
  },
  teamLogoContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  teamLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    padding: 15,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  teamDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  teamDetailText: {
    fontSize: 12,
    marginLeft: 5,
  },
  divisionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  divisionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  
  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
  // Tabs
  tabsContainer: {
    marginVertical: 10,
  },
  tabsContentContainer: {
    paddingHorizontal: 15,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Registration form
  registrationForm: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  formField: {
    marginBottom: 15,
  },
  fieldLabel: {
    marginBottom: 5,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  formOptionsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  divisionOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  divisionOptionText: {
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Dropdown styles
  dropdownContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  dropdownLabel: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  formOptionsContainer: {
    flexDirection: 'row',
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    color: '#333',
  },
});
