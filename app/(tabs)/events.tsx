import AppHeader from '@/components/AppHeader';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Event, eventService, Team, teamService } from '@/services/supabaseRest';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock data for events
const initialEvents = [
  {
    id: '1',
    title: 'National Hockey Championship',
    date: '2025-06-15',
    location: 'Windhoek Stadium',
    description: 'Annual national hockey championship featuring top teams from across Namibia.',
    image: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    registration_deadline: '2025-06-01',
    status: 'Upcoming'
  },
  {
    id: '2',
    title: 'Youth Hockey Tournament',
    date: '2025-07-10',
    location: 'Swakopmund Sports Complex',
    description: 'Tournament for youth hockey players under 18 years of age.',
    image: 'https://images.unsplash.com/photo-1607457561901-e6ec3a6d16cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    registration_deadline: '2025-06-25',
    status: 'Upcoming'
  },
  {
    id: '3',
    title: 'Coastal Hockey Cup',
    date: '2025-08-05',
    location: 'Walvis Bay Sports Ground',
    description: 'Regional tournament for teams from coastal regions of Namibia.',
    image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74b38?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    registration_deadline: '2025-07-20',
    status: 'Upcoming'
  },
  {
    id: '4',
    title: 'Hockey Skills Workshop',
    date: '2025-05-25',
    location: 'Otjiwarongo Training Center',
    description: 'Workshop focusing on improving hockey skills for players of all levels.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60',
    registration_deadline: '2025-05-20',
    status: 'Upcoming'
  },
];

export default function EventsScreen() {
  const colorScheme = useColorScheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEventDetailsModal, setShowEventDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showTeamSelection, setShowTeamSelection] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  // Date picker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [currentDateField, setCurrentDateField] = useState<'date' | 'deadline'>('date');
  
  // Calculate a default registration deadline (7 days before event date)
  const defaultEventDate = new Date();
  const defaultDeadlineDate = new Date();
  defaultDeadlineDate.setDate(defaultEventDate.getDate() - 7);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: defaultEventDate.toISOString().split('T')[0],
    location: '',
    description: '',
    registration_deadline: defaultDeadlineDate.toISOString().split('T')[0],
    time: '12:00',
    teams: [] as string[],
    type: 'match',
    status: 'upcoming'
  });
  
  // Load events and teams on component mount
  useEffect(() => {
    loadEvents();
    loadTeams();
  }, []);
  
  const loadEvents = async () => {
    setLoading(true);
    try {
      const fetchedEvents = await eventService.getEvents();
      setEvents(fetchedEvents || []);
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
      // Use mock data as fallback
      setEvents(initialEvents as Event[]);
    } finally {
      setLoading(false);
    }
  };
  
  const loadTeams = async () => {
    try {
      const fetchedTeams = await teamService.getTeams();
      setTeams(fetchedTeams || []);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.location || !newEvent.registration_deadline) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate that the registration deadline is before the event date
    if (isDeadlineAfterEventDate(newEvent.registration_deadline, newEvent.date)) {
      Alert.alert('Invalid Date', 'Registration deadline must be before the event date');
      return;
    }

    setLoading(true);
    try {
      // Create event in Supabase
      const eventData = {
        id: Date.now().toString(),
        title: newEvent.title,
        date: newEvent.date,
        location: newEvent.location,
        description: newEvent.description || 'No description provided',
        registration_deadline: newEvent.registration_deadline,
        status: 'upcoming',
        time: newEvent.time,
        teams: newEvent.teams,
        type: newEvent.type,
        created_at: new Date().toISOString(),
        image: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60'
      } as Event;

      const createdEvent = await eventService.createEvent(eventData);

      if (createdEvent) {
        // Update local state
        setEvents([...events, createdEvent]);
        // Reset form state with proper deadline calculation
        const resetEventDate = new Date();
        const resetDeadlineDate = new Date();
        resetDeadlineDate.setDate(resetEventDate.getDate() - 7);
        
        setNewEvent({
          title: '',
          date: resetEventDate.toISOString().split('T')[0],
          location: '',
          description: '',
          registration_deadline: resetDeadlineDate.toISOString().split('T')[0],
          time: '12:00',
          teams: [],
          type: 'match',
          status: 'upcoming'
        });
        setShowRegistrationForm(false);
        Alert.alert('Success', `Event "${newEvent.title}" has been created successfully!`);
      } else {
        Alert.alert('Error', 'Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'An unexpected error occurred while creating the event.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegisterForEvent = async (event: Event) => {
    setSelectedEvent(event);
    setShowTeamSelection(true);
  };
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const success = await eventService.deleteEvent(eventId);
              
              if (success) {
                // Update local state by removing the deleted event
                setEvents(events.filter(e => e.id !== eventId));
                setShowEventDetailsModal(false);
                Alert.alert('Success', 'Event has been deleted successfully!');
              } else {
                Alert.alert('Error', 'Failed to delete event. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'An unexpected error occurred while deleting the event.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const submitTeamRegistration = async () => {
    if (!selectedEvent || !selectedTeam) {
      Alert.alert('Error', 'Please select a team to register');
      return;
    }
    
    try {
      // Add the team to the event's teams list
      const updatedTeams = [...(selectedEvent.teams || [])];
      if (!updatedTeams.includes(selectedTeam)) {
        updatedTeams.push(selectedTeam);
        
        // Update the event in the database
        const updatedEvent = await eventService.updateEvent(selectedEvent.id, {
          teams: updatedTeams
        });
        
        if (updatedEvent) {
          // Update the local state
          setEvents(events.map(e => e.id === selectedEvent.id ? updatedEvent : e));
          Alert.alert('Success', 'Team registered successfully for the event!');
          setShowTeamSelection(false);
          setSelectedTeam('');
        } else {
          Alert.alert('Error', 'Failed to register team. Please try again.');
        }
      } else {
        Alert.alert('Error', 'This team is already registered for the event.');
      }
    } catch (error) {
      console.error('Error registering team for event:', error);
      Alert.alert('Error', 'An unexpected error occurred while registering the team.');
    }
  };

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getDaysRemaining = (dateString: string): number => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const handleShowDatePicker = (field: 'date' | 'deadline') => {
    setCurrentDateField(field);
    if (field === 'date') {
      setShowDatePicker(true);
    } else {
      setShowDeadlinePicker(true);
    }
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      setShowDeadlinePicker(false);
    }
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      if (currentDateField === 'date') {
        // When event date changes, update the deadline to be 7 days before the event date
        // only if the deadline hasn't been manually set (is still the default)
        const newDate = new Date(selectedDate);
        const deadlineDate = new Date(newDate);
        deadlineDate.setDate(newDate.getDate() - 7);
        const deadlineDateString = deadlineDate.toISOString().split('T')[0];
        
        setNewEvent({ 
          ...newEvent, 
          date: dateString,
          // Only update the deadline if it's the default or if it's after the event date
          registration_deadline: isDeadlineAfterEventDate(newEvent.registration_deadline, dateString) ? 
            deadlineDateString : newEvent.registration_deadline
        });
      } else {
        // Make sure the deadline is not after the event date
        if (isDeadlineAfterEventDate(dateString, newEvent.date)) {
          Alert.alert('Invalid Date', 'Registration deadline must be before the event date');
          return;
        }
        setNewEvent({ ...newEvent, registration_deadline: dateString });
      }
    }
  };

  // Helper function to check if deadline is after event date
  const isDeadlineAfterEventDate = (deadline: string, eventDate: string): boolean => {
    const deadlineDate = new Date(deadline);
    const eventDateTime = new Date(eventDate);
    return deadlineDate >= eventDateTime;
  };

  // Event details modal
  const EventDetailsModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showEventDetailsModal}
        onRequestClose={() => setShowEventDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>{selectedEvent.title}</Text>
              <TouchableOpacity onPress={() => setShowEventDetailsModal(false)} style={styles.closeButton}>
                <Text style={{ color: Colors[colorScheme ?? 'light'].text, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
            
            {selectedEvent.image && <Image source={{ uri: selectedEvent.image }} style={styles.modalEventImage} />}
            
            <View style={styles.eventDetailSection}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Date:</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>{formatDate(selectedEvent.date)}</Text>
            </View>
            
            <View style={styles.eventDetailSection}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Time:</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>{selectedEvent.time}</Text>
            </View>
            
            <View style={styles.eventDetailSection}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Location:</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>{selectedEvent.location}</Text>
            </View>
            
            <View style={styles.eventDetailSection}>
              <Text style={[styles.detailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>Description:</Text>
              <Text style={[styles.detailValue, { color: Colors[colorScheme ?? 'light'].text }]}>{selectedEvent.description}</Text>
            </View>
            
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text, marginTop: 16 }]}>Registered Teams</Text>
            
            <ScrollView style={styles.participantsList}>
              {selectedEvent.teams && selectedEvent.teams.length > 0 ? (
                selectedEvent.teams.map((teamId, index) => {
                  const team = teams.find(t => t.id === teamId) || teams.find(t => t.name === teamId);
                  const teamName = team ? team.name : teamId;
                  
                  return (
                    <View key={index} style={[styles.participantItem, { borderBottomColor: Colors[colorScheme ?? 'light'].border }]}>
                      <Text style={[styles.participantName, { color: Colors[colorScheme ?? 'light'].text }]}>{teamName}</Text>
                    </View>
                  );
                })
              ) : (
                <Text style={[styles.noParticipantsText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>No teams registered yet.</Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.registerButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={() => {
                setShowEventDetailsModal(false);
                handleRegisterForEvent(selectedEvent);
              }}
            >
              <Text style={styles.registerButtonText}>Register Team</Text>
            </TouchableOpacity>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.closeModalButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint, marginTop: 8, flex: 1, marginRight: 8 }]}
                onPress={() => setShowEventDetailsModal(false)}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.deleteButton, { backgroundColor: '#f44336', marginTop: 8, flex: 1 }]}
                onPress={() => handleDeleteEvent(selectedEvent.id)}
              >
                <Text style={styles.deleteButtonText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Team selection modal for event registration
  const TeamSelectionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTeamSelection}
        onRequestClose={() => setShowTeamSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Select Team to Register</Text>
              <TouchableOpacity onPress={() => setShowTeamSelection(false)} style={styles.closeButton}>
                <Text style={{ color: Colors[colorScheme ?? 'light'].text, fontSize: 18 }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.teamsList}>
              {teams.length > 0 ? (
                teams.map((team) => (
                  <TouchableOpacity 
                    key={team.id} 
                    style={[
                      styles.teamSelectItem, 
                      { 
                        backgroundColor: selectedTeam === team.id ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].card,
                        borderColor: Colors[colorScheme ?? 'light'].border
                      }
                    ]}
                    onPress={() => setSelectedTeam(team.id || team.name)}
                  >
                    <Text style={[
                      styles.teamSelectName, 
                      { color: selectedTeam === team.id ? 'white' : Colors[colorScheme ?? 'light'].text }
                    ]}>
                      {team.name}
                    </Text>
                    <Text style={[
                      styles.teamSelectDivision, 
                      { color: selectedTeam === team.id ? 'white' : Colors[colorScheme ?? 'light'].tabIconDefault }
                    ]}>
                      {team.division}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.noTeamsText, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                  No teams available. Please create a team first.
                </Text>
              )}
            </ScrollView>
            
            <TouchableOpacity 
              style={[
                styles.registerButton, 
                { 
                  backgroundColor: selectedTeam ? Colors[colorScheme ?? 'light'].tint : '#cccccc',
                  opacity: selectedTeam ? 1 : 0.7
                }
              ]}
              onPress={submitTeamRegistration}
              disabled={!selectedTeam}
            >
              <Text style={styles.registerButtonText}>Register Team</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.closeModalButton, { backgroundColor: '#f44336', marginTop: 8 }]}
              onPress={() => {
                setShowTeamSelection(false);
                setSelectedTeam('');
              }}
            >
              <Text style={styles.closeModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <AppHeader title="Events" />
        <TouchableOpacity 
          style={[styles.createButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={() => setShowRegistrationForm(!showRegistrationForm)}
        >
          <Text style={styles.createButtonText}>
            {showRegistrationForm ? 'Cancel' : 'Create Event'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchInput, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          color: Colors[colorScheme ?? 'light'].text,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}
        placeholder="Search events..."
        placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {showRegistrationForm && (
        <View style={[styles.registrationForm, { 
          backgroundColor: Colors[colorScheme ?? 'light'].card,
          borderColor: Colors[colorScheme ?? 'light'].border
        }]}>
          <Text style={[styles.formTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Create New Event
          </Text>
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            placeholder="Event Title"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newEvent.title}
            onChangeText={(text) => setNewEvent({...newEvent, title: text})}
          />
          
          <TouchableOpacity 
            style={[styles.datePickerButton, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            onPress={() => handleShowDatePicker('date')}
          >
            <Text style={[styles.datePickerLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Event Date:
            </Text>
            <Text style={[styles.datePickerValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatDate(newEvent.date)}
            </Text>
          </TouchableOpacity>
          
          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              testID="datePicker"
              value={new Date(newEvent.date)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          
          <TextInput
            style={[styles.input, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            placeholder="Location"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newEvent.location}
            onChangeText={(text) => setNewEvent({...newEvent, location: text})}
          />
          
          <TextInput
            style={[styles.textArea, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              color: Colors[colorScheme ?? 'light'].text,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            placeholder="Description"
            placeholderTextColor={Colors[colorScheme ?? 'light'].tabIconDefault}
            value={newEvent.description}
            onChangeText={(text) => setNewEvent({...newEvent, description: text})}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <TouchableOpacity 
            style={[styles.datePickerButton, { 
              backgroundColor: Colors[colorScheme ?? 'light'].background,
              borderColor: Colors[colorScheme ?? 'light'].border
            }]}
            onPress={() => handleShowDatePicker('deadline')}
          >
            <Text style={[styles.datePickerLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
              Registration Deadline:
            </Text>
            <Text style={[styles.datePickerValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {formatDate(newEvent.registration_deadline)}
            </Text>
          </TouchableOpacity>
          
          {Platform.OS === 'ios' && showDeadlinePicker && (
            <DateTimePicker
              testID="deadlinePicker"
              value={new Date(newEvent.registration_deadline)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          
          {Platform.OS === 'android' && (showDatePicker || showDeadlinePicker) && (
            <DateTimePicker
              testID="androidDatePicker"
              value={showDatePicker ? new Date(newEvent.date) : new Date(newEvent.registration_deadline)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={handleCreateEvent}
          >
            <Text style={styles.submitButtonText}>Create Event</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.eventsList}>
        {filteredEvents.map(event => {
          const daysRemaining = getDaysRemaining(event.date);
          
          return (
            <View 
              key={event.id} 
              style={[styles.eventCard, { 
                backgroundColor: Colors[colorScheme ?? 'light'].card,
                borderColor: Colors[colorScheme ?? 'light'].border
              }]}
            >
              <Image source={{ uri: 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60' }} style={styles.eventImage} />
              
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {event.title}
                </Text>
                
                <View style={styles.eventDetails}>
                  <View style={styles.eventDetail}>
                    <Text style={[styles.eventDetailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Date:
                    </Text>
                    <Text style={[styles.eventDetailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {formatDate(event.date)}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetail}>
                    <Text style={[styles.eventDetailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Location:
                    </Text>
                    <Text style={[styles.eventDetailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {event.location}
                    </Text>
                  </View>
                  
                  <View style={styles.eventDetail}>
                    <Text style={[styles.eventDetailLabel, { color: Colors[colorScheme ?? 'light'].tabIconDefault }]}>
                      Registration Deadline:
                    </Text>
                    <Text style={[styles.eventDetailText, { color: Colors[colorScheme ?? 'light'].text }]}>
                      {formatDate(event.registration_deadline)}
                    </Text>
                  </View>
                </View>
                
                <Text 
                  style={[styles.eventDescription, { color: Colors[colorScheme ?? 'light'].text }]}
                  numberOfLines={2}
                >
                  {event.description}
                </Text>
                
                <View style={styles.eventActions}>
                  <View style={[
                    styles.statusBadge, 
                    { backgroundColor: daysRemaining > 0 ? '#4CAF50' : '#F44336' }
                  ]}>
                    <Text style={styles.statusText}>
                      {daysRemaining > 0 ? `${daysRemaining} days left` : 'Event passed'}
                    </Text>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={[styles.registerEventButton, { backgroundColor: '#2196F3' }]}
                      onPress={() => {
                        setSelectedEvent(event);
                        setShowEventDetailsModal(true);
                      }}
                    >
                      <Text style={styles.registerEventButtonText}>Details</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.registerEventButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
                      onPress={() => handleRegisterForEvent(event)}
                      disabled={daysRemaining <= 0}
                    >
                      <Text style={styles.registerEventButtonText}>Register</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      
      {/* Event details modal */}
      <EventDetailsModal />
      
      {/* Team selection modal */}
      <TeamSelectionModal />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  eventDetailSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 100,
  },
  detailValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  participantsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  participantItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  noParticipantsText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  registerButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Loading and empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  noDataContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  addFirstButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalEventImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    position: 'absolute',
    right: 16,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  eventsList: {
    paddingHorizontal: 16,
  },
  eventCard: {
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: 150,
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  eventDetailLabel: {
    fontWeight: 'bold',
    marginRight: 4,
  },
  eventDetailText: {
    flex: 1,
  },
  eventDescription: {
    marginBottom: 12,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  registerEventButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  registerEventButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  registrationForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    minHeight: 100,
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  datePickerLabel: {
    fontWeight: 'bold',
  },
  datePickerValue: {
    flex: 1,
    textAlign: 'right',
  },
  teamsList: {
    maxHeight: 300,
    marginVertical: 16,
  },
  teamSelectItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  teamSelectName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  teamSelectDivision: {
    fontSize: 14,
  },
  noTeamsText: {
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
