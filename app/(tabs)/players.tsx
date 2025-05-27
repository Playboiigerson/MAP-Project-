import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Player, playerService, teamService } from '@/services/supabaseRest';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for players
const initialPlayers = [
  { 
    id: '1', 
    name: 'David Muller', 
    team: 'Windhoek Warriors', 
    position: 'Forward', 
    goals: 12, 
    assists: 8, 
    yellow_cards: 1, 
    red_cards: 0,
    image: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  { 
    id: '2', 
    name: 'Sophia Nekwaya', 
    team: 'Swakopmund Strikers', 
    position: 'Midfielder', 
    goals: 8, 
    assists: 14, 
    yellow_cards: 2, 
    red_cards: 0,
    image: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  { 
    id: '3', 
    name: 'Thomas Shilongo', 
    team: 'Walvis Bay Wolves', 
    position: 'Defender', 
    goals: 2, 
    assists: 5, 
    yellow_cards: 3, 
    red_cards: 1,
    image: 'https://randomuser.me/api/portraits/men/67.jpg'
  },
  { 
    id: '4', 
    name: 'Anna Shipanga', 
    team: 'Otjiwarongo Owls', 
    position: 'Goalkeeper', 
    goals: 0, 
    assists: 0, 
    yellow_cards: 0, 
    red_cards: 0,
    image: 'https://randomuser.me/api/portraits/women/28.jpg'
  },
];

// Mock data for teams (for registration dropdown)
const teams = [
  'Windhoek Warriors', 
  'Swakopmund Strikers', 
  'Walvis Bay Wolves', 
  'Otjiwarongo Owls'
];

// Simple icon component using SF Symbols naming convention
const IconSymbol = ({ name, size, color, style }: { name: string, size: number, color: string, style?: any }) => {
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
    'person.badge.plus': 'person-add',
    'sportscourt.fill': 'football',
    'medal.fill': 'medal',
    'star.fill': 'star'
  };

  const ionIconName = iconMap[name] || 'help-circle';
  
  return (
    <Ionicons name={ionIconName as any} size={size} color={color} style={style} />
  );
};

// Player detail modal component
const PlayerDetailModal = ({ player, visible, onClose }: { player: Player | null, visible: boolean, onClose: () => void }) => {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
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
    if (player && visible && player.team_id) {
      loadTeamInfo(player.team_id);
    }
  }, [player, visible]);

  const loadTeamInfo = async (teamId: string) => {
    setLoading(true);
    try {
      const team = await teamService.getTeamById(teamId);
      if (team) {
        setTeamName(team.name);
      }
    } catch (error) {
      console.error('Error loading team info:', error);
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

  if (!player) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0]
  });

  // Generate a player color based on position for visual interest
  const getPlayerColor = (position: string) => {
    const positionColors: {[key: string]: string} = {
      'Forward': Colors[colorScheme ?? 'light'].primary,
      'Midfielder': Colors[colorScheme ?? 'light'].secondary,
      'Defender': Colors[colorScheme ?? 'light'].accent,
      'Goalkeeper': '#4CAF50', // Green for goalkeepers
      'Utility': '#9C27B0', // Purple for utility players
    };
    
    return positionColors[position] || Colors[colorScheme ?? 'light'].primary;
  };

  const playerColor = getPlayerColor(player.position);

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
          {/* Player header with color accent */}
          <View style={[styles.playerHeaderBanner, { backgroundColor: playerColor }]}>
            <View style={styles.playerAvatarContainer}>
              <View style={styles.playerAvatar}>
                <Text style={styles.playerInitials}>
                  {player.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
            </View>
            <Text style={styles.modalTitle}>{player.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <IconSymbol name="xmark.circle.fill" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Player stats cards */}
            <View style={styles.playerStatsContainer}>
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: playerColor }]}>{player.position}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Position</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: playerColor }]}>{player.jersey_number || '-'}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Jersey</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                <Text style={[styles.statValue, { color: playerColor }]}>{teamName || 'Unknown'}</Text>
                <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Team</Text>
              </View>
            </View>

            {/* Player performance section */}
            <View style={styles.performanceSection}>
              <View style={styles.sectionHeaderRow}>
                <IconSymbol name="star.fill" size={20} color={playerColor} />
                <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Performance Stats</Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={[styles.statTile, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: playerColor }]}>
                    <IconSymbol name="sportscourt.fill" size={20} color="white" />
                  </View>
                  <Text style={[styles.statTileValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {player.stats?.goals || 0}
                  </Text>
                  <Text style={[styles.statTileLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Goals
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: playerColor }]}>
                    <IconSymbol name="person.fill" size={20} color="white" />
                  </View>
                  <Text style={[styles.statTileValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {player.stats?.assists || 0}
                  </Text>
                  <Text style={[styles.statTileLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Assists
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#FFC107' }]}>
                    <IconSymbol name="medal.fill" size={20} color="white" />
                  </View>
                  <Text style={[styles.statTileValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {0}
                  </Text>
                  <Text style={[styles.statTileLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Yellow Cards
                  </Text>
                </View>

                <View style={[styles.statTile, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#F44336' }]}>
                    <IconSymbol name="xmark.circle.fill" size={20} color="white" />
                  </View>
                  <Text style={[styles.statTileValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                    {0}
                  </Text>
                  <Text style={[styles.statTileLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                    Red Cards
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.closeModalButton, { backgroundColor: playerColor }]}
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

export default function PlayersScreen() {
  const colorScheme = useColorScheme();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ 
    id: '',
    name: '', 
    team_id: '', 
    position: '',
    jersey_number: 0
  });
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [teamsData, setTeamsData] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activePosition, setActivePosition] = useState('all');
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Position options for filter tabs
  const positions = [
    { id: 'all', label: 'All Players' },
    { id: 'Forward', label: 'Forwards' },
    { id: 'Midfielder', label: 'Midfielders' },
    { id: 'Defender', label: 'Defenders' },
    { id: 'Goalkeeper', label: 'Goalkeepers' },
    { id: 'Utility', label: 'Utility' }
  ];
  
  // Animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });
  
  const tabsTopMargin = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [120, 70],
    extrapolate: 'clamp',
  });
  
  // Load players and teams on component mount
  useEffect(() => {
    loadPlayers();
    loadTeams();
  }, []);
  
  // Reload teams whenever the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('Players screen focused, reloading teams');
      loadTeams();
      return () => {};
    }, [])
  );
  
  const loadPlayers = async () => {
    setLoading(true);
    try {
      const fetchedPlayers = await playerService.getPlayers();
      setPlayers(fetchedPlayers || []);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Error', 'Failed to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTeams = async () => {
    try {
      // Get teams from our teamService
      const fetchedTeams = await teamService.getTeams();
      if (fetchedTeams && fetchedTeams.length > 0) {
        // Save the full teams data
        setTeamsData(fetchedTeams);
        // Extract teams for the dropdown
        setTeamsList(fetchedTeams);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const getFilteredPlayers = () => {
    const filtered = players.filter(player => {
      // Filter by search query
      const matchesSearch = 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.team_id && getTeamName(player.team_id).toLowerCase().includes(searchQuery.toLowerCase())) ||
        player.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by position tab
      const matchesPosition = activePosition === 'all' || player.position === activePosition;
      
      return matchesSearch && matchesPosition;
    });
    
    // Sort by name
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const handleViewPlayerDetails = (player: Player) => {
    setSelectedPlayer(player);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleEditPlayer = (player: Player) => {
    setIsEditing(true);
    setNewPlayer({
      id: player.id || '',
      name: player.name,
      team_id: player.team_id || '',
      position: player.position,
      jersey_number: player.jersey_number || 0
    });
    setShowRegistrationForm(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  const handleDeletePlayer = async (playerId: string) => {
    Alert.alert(
      "Delete Player",
      "Are you sure you want to delete this player?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await playerService.deletePlayer(playerId);
              if (result) {
                // Player deleted successfully
                loadPlayers(); // Reload players
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } else {
                Alert.alert('Error', 'Failed to delete player.');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            } catch (error) {
              console.error('Error deleting player:', error);
              Alert.alert('Error', 'Failed to delete player.');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRegisterPlayer = async () => {
    if (!newPlayer.name || !newPlayer.team_id || !newPlayer.position) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare the player data according to the interface
      const playerData: Partial<Player> = {
        name: newPlayer.name,
        team_id: newPlayer.team_id,
        position: newPlayer.position,
        jersey_number: newPlayer.jersey_number || Math.floor(Math.random() * 99) + 1,
        stats: {
          goals: 0,
          assists: 0
        }
      };
      
      let result;
      
      if (newPlayer.id) {
        // We're updating an existing player
        result = await playerService.updatePlayer(newPlayer.id, playerData);
        if (result) {
          Alert.alert('Success', 'Player updated successfully!');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } else {
        // We're creating a new player
        const createData = {
          ...playerData,
          id: Date.now().toString(),
          created_at: new Date().toISOString()
        } as Player;
        
        result = await playerService.createPlayer(createData);
        if (result) {
          Alert.alert('Success', 'Player registered successfully!');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      
      // Reset form and reload players
      setNewPlayer({ id: '', name: '', team_id: '', position: '', jersey_number: 0 });
      setShowRegistrationForm(false);
      setIsEditing(false);
      loadPlayers();
    } catch (error) {
      console.error(newPlayer.id ? 'Error updating player:' : 'Error registering player:', error);
      Alert.alert('Error', newPlayer.id ? 'Failed to update player. Please try again.' : 'Failed to register player. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: string) => {
    const team = teamsData.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };
  
  // Get a color based on position for visual interest
  const getPositionColor = (position: string) => {
    const positionColors: {[key: string]: string} = {
      'Forward': Colors[colorScheme ?? 'light'].primary,
      'Midfielder': Colors[colorScheme ?? 'light'].secondary,
      'Defender': Colors[colorScheme ?? 'light'].accent,
      'Goalkeeper': '#4CAF50', // Green for goalkeepers
      'Utility': '#9C27B0', // Purple for utility players
    };
    
    return positionColors[position] || Colors[colorScheme ?? 'light'].primary;
  };

  const filteredPlayers = getFilteredPlayers();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.animatedHeader, 
          { 
            height: headerHeight,
            backgroundColor: Colors[colorScheme ?? 'light'].background
          }
        ]}
      >
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Players
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
            Browse, filter, and manage players
          </Text>
        </Animated.View>
        
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={[styles.searchBar, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <IconSymbol name="magnifyingglass" size={18} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <TextInput
              style={[styles.searchInput, { color: Colors[colorScheme ?? 'light'].text }]}
              placeholder="Search players..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <IconSymbol name="xmark.circle.fill" size={18} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => {
              setIsEditing(false);
              setNewPlayer({ id: '', name: '', team_id: '', position: '', jersey_number: 0 });
              setShowRegistrationForm(!showRegistrationForm);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <IconSymbol name={showRegistrationForm ? "xmark" : "plus"} size={24} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>
      
      {/* Position Filter Tabs */}
      <Animated.View 
        style={[
          styles.tabsContainer, 
          { 
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            top: tabsTopMargin,
          }
        ]}
      >
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {positions.map(pos => (
            <TouchableOpacity
              key={pos.id}
              style={[
                styles.tabButton,
                activePosition === pos.id && [
                  styles.activeTab, 
                  { borderColor: Colors[colorScheme ?? 'light'].tint }
                ]
              ]}
              onPress={() => {
                setActivePosition(pos.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text 
                style={[
                  styles.tabText, 
                  { color: Colors[colorScheme ?? 'light'].text },
                  activePosition === pos.id && { color: Colors[colorScheme ?? 'light'].tint }
                ]}
              >
                {pos.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Player Registration Form */}
      {showRegistrationForm && (
        <View style={[styles.registrationForm, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          <View style={styles.formHeader}>
            <Text style={[styles.formTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {isEditing ? 'Update Player' : 'Register New Player'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowRegistrationForm(false);
              setIsEditing(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}>
              <IconSymbol name="xmark.circle.fill" size={24} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            placeholder="Player Name"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newPlayer.name}
            onChangeText={(text) => setNewPlayer({...newPlayer, name: text})}
          />
          
          {/* Team Selection Dropdown */}
          <View style={[styles.pickerContainer, { 
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].border
          }]}>
            <IconSymbol 
              name="person.3.fill" 
              size={18} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault} 
              style={styles.pickerIcon}
            />
            <View style={styles.pickerWrapper}>
              <FlatList
                data={teamsList}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.teamChip,
                      newPlayer.team_id === item.id && { 
                        backgroundColor: Colors[colorScheme ?? 'light'].tint
                      }
                    ]}
                    onPress={() => {
                      setNewPlayer({...newPlayer, team_id: item.id});
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.teamChipText,
                      newPlayer.team_id === item.id && { color: 'white' }
                    ]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          
          {/* Position Selection */}
          <View style={[styles.pickerContainer, { 
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].border
          }]}>
            <IconSymbol 
              name="sportscourt.fill" 
              size={18} 
              color={Colors[colorScheme ?? 'light'].tabIconDefault} 
              style={styles.pickerIcon}
            />
            <View style={styles.pickerWrapper}>
              <FlatList
                data={['Forward', 'Midfielder', 'Defender', 'Goalkeeper', 'Utility']}
                keyExtractor={(item) => item}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.positionChip,
                      newPlayer.position === item && { 
                        backgroundColor: getPositionColor(item)
                      }
                    ]}
                    onPress={() => {
                      setNewPlayer({...newPlayer, position: item});
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[
                      styles.positionChipText,
                      newPlayer.position === item && { color: 'white' }
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          
          {/* Jersey Number */}
          <TextInput
            style={[styles.input, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            placeholder="Jersey Number"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newPlayer.jersey_number.toString()}
            onChangeText={(text) => setNewPlayer({...newPlayer, jersey_number: parseInt(text) || 0})}
            keyboardType="number-pad"
          />
          
          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleRegisterPlayer}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.registerButtonText}>
                {isEditing ? 'Update Player' : 'Register Player'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Players List */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 170 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {loading && players.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
            <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Loading players...
            </Text>
          </View>
        ) : filteredPlayers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <IconSymbol name="person.badge.plus" size={60} color={Colors[colorScheme ?? 'light'].tabIconDefault} />
            <Text style={[styles.emptyStateTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              {searchQuery ? 'No matching players found' : 'No players registered yet'}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              {searchQuery 
                ? 'Try a different search term or position filter'
                : 'Add your first player using the + button above'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={[styles.emptyStateButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                onPress={() => {
                  setShowRegistrationForm(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.emptyStateButtonText}>Add First Player</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.playersContainer}>
            {filteredPlayers.map(player => (
              <TouchableOpacity
                key={player.id}
                style={[
                  styles.playerCard, 
                  { backgroundColor: Colors[colorScheme ?? 'light'].card }
                ]}
                onPress={() => handleViewPlayerDetails(player)}
                activeOpacity={0.7}
              >
                <View style={styles.playerCardContent}>
                  <View style={[
                    styles.playerAvatar, 
                    { backgroundColor: getPositionColor(player.position) }
                  ]}>
                    <Text style={styles.playerAvatarText}>
                      {player.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {player.name}
                    </Text>
                    <View style={styles.playerDetail}>
                      <Text style={[styles.playerTeam, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                        {getTeamName(player.team_id || '')}
                      </Text>
                      <View style={[
                        styles.positionBadge, 
                        { backgroundColor: getPositionColor(player.position) }
                      ]}>
                        <Text style={styles.positionText}>
                          {player.position}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.playerActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                      onPress={() => handleEditPlayer(player)}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <IconSymbol name="pencil" size={16} color={Colors[colorScheme ?? 'light'].tint} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                      onPress={() => handleDeletePlayer(player.id || '')}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <IconSymbol name="trash" size={16} color="#F44336" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Player Stats Preview */}
                <View style={styles.playerStatsPreview}>
                  <View style={styles.statPreviewItem}>
                    <Text style={[styles.statValue, { color: getPositionColor(player.position) }]}>
                      {player.jersey_number || '-'}
                    </Text>
                    <Text style={[styles.statDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Jersey
                    </Text>
                  </View>
                  <View style={styles.statPreviewItem}>
                    <Text style={[styles.statValue, { color: getPositionColor(player.position) }]}>
                      {player.stats?.goals || 0}
                    </Text>
                    <Text style={[styles.statDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Goals
                    </Text>
                  </View>
                  <View style={styles.statPreviewItem}>
                    <Text style={[styles.statValue, { color: getPositionColor(player.position) }]}>
                      {player.stats?.assists || 0}
                    </Text>
                    <Text style={[styles.statDescription, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Assists
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.ScrollView>
      
      {/* Player Detail Modal */}
      <PlayerDetailModal 
        player={selectedPlayer}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedPlayer(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 0,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  playerHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  playerAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playerAvatar: {
    flex: 1,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 16,
  },
  playerStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  performanceSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statTile: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTileValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTileLabel: {
    fontSize: 12,
  },
  closeModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Main screen styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // Registration form styles
  registrationForm: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    padding: 8,
  },
  pickerIcon: {
    marginRight: 8,
  },
  pickerWrapper: {
    flex: 1,
  },
  teamChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  teamChipText: {
    fontWeight: '600',
  },
  positionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  positionChipText: {
    fontWeight: '600',
  },
  registerButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Animated header styles
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 10,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    height: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tab styles
  tabsContainer: {
    position: 'absolute',
    zIndex: 90,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  activeTab: {
    borderWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // List styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  playersContainer: {
    paddingBottom: 20,
  },
  playerCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  playerTeam: {
    fontSize: 14,
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  playerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  playerStatsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    marginTop: 12,
    paddingTop: 12,
  },
  statPreviewItem: {
    alignItems: 'center',
  },
  statDescription: {
    fontSize: 12,
    marginTop: 4,
  },
});
