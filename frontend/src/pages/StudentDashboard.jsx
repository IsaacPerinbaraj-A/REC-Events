import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, userAPI } from '../services/api';
import { getUser, logout } from '../utils/auth'; 

const StudentDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [registeredEvents, setRegisteredEvents] = useState([]); // FIXED: Added getter
  const [stats, setStats] = useState({ totalEvents: 0, registeredEvents: 0, upcomingEvents: 0, certificates: 0 });

  const navigate = useNavigate();
  
   const getInitials = (name) => {
    if (!name || name.trim() === '') return 'U';
    
    const names = name.trim().split(' ').filter(n => n.length > 0);
    
    if (names.length === 0) return 'U';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    // Take first letter of first name and first letter of second name
    return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
  };

  // Navigation state
  const [activeTab, setActiveTab] = useState('events');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  
  // User & Profile state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: "John Doe",
    email: "john.doe@rec.edu",
    rollNumber: "21CS001",
    department: "Computer Science",
    semester: "6th",
    phone: "+91 9876543210",
    avatar: "JD"
  });

  // Events & Registration state
  const [registeredEventIds, setRegisteredEventIds] = useState([]); // FIXED: Start with empty array
  
  // Notifications state
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New event: AI Workshop starts in 2 days", time: "2 hours ago", read: false, type: "event" },
    { id: 2, message: "Registration confirmed for Web Development Bootcamp", time: "1 day ago", read: false, type: "registration" },
    { id: 3, message: "Certificate available for download", time: "2 days ago", read: true, type: "certificate" }
  ]);

  // Certificates state
  const [certificates, setCertificates] = useState([
    { 
      id: 1, 
      eventId: 7,
      eventName: "Python Bootcamp 2024", 
      issueDate: "2024-09-15", 
      certificateUrl: "#",
      downloadUrl: "/certificates/python-bootcamp-2024.pdf"
    }
  ]);

  // Calendar Integration state
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [calendarConnections, setCalendarConnections] = useState({
    google: false,
    outlook: false,
    apple: false
  });

  // QR Code state
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedQREvent, setSelectedQREvent] = useState(null);

  const [eventsData, setEventsData] = useState([]); // FIXED: Start with empty array, will be populated from backend

  // Event history
  const [eventHistory, setEventHistory] = useState([
    {
      id: 7,
      title: "Python Bootcamp 2024",
      category: "technical",
      date: "2024-09-10",
      time: "10:00 AM",
      venue: "Lab 2",
      organizer: "Tech Club",
      attended: true,
      certificateAvailable: true,
      rating: 5,
      feedback: "Excellent workshop!"
    }
  ]);

  // API Integration - Backend Ready
  // Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get user data
        const userData = getUser();
        if (userData) {
          setUserProfile(userData);
          setUserProfile({
          name: userData.name || 'User',
          email: userData.email || 'user@rec.edu',
          rollNumber: userData.rollNumber || 'N/A',
          department: userData.department || 'N/A',
          semester: userData.semester || 'N/A',
          phone: userData.phone || 'N/A',
          avatar: getInitials(userData.name)
        });
        }

        // Fetch all events
        const eventsResponse = await eventAPI.getAllEvents({
          status: filterCategory === 'all' ? undefined : filterCategory
        });
        
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events); // FIXED: Use backend data
        }

        // Fetch user's registrations
        const registrationsResponse = await registrationAPI.getMyRegistrations();
        
        if (registrationsResponse.success) {
          setRegisteredEvents(registrationsResponse.registrations);
          
          // FIXED: Extract event IDs correctly from registration response
          const eventIds = registrationsResponse.registrations.map(reg => 
            reg.event._id || reg.event || reg.eventId
          );
          setRegisteredEventIds(eventIds);
        }

        // Fetch user stats
        const statsResponse = await userAPI.getUserStats();
        
        if (statsResponse.success) {
          setStats({
            totalEvents: eventsResponse.events.length,
            registeredEvents: registrationsResponse.registrations.length,
            upcomingEvents: eventsResponse.events.filter(e => new Date(e.date) > new Date()).length,
            certificates: statsResponse.stats.totalCertificates
          });
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error loading data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterCategory]);


  // Calendar Integration Functions
  const connectCalendar = async (provider) => {
    console.log(`Connecting to ${provider} calendar...`);
    setCalendarConnections({
      ...calendarConnections,
      [provider]: true
    });
    showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} Calendar connected!`, 'success');
  };

  const syncEventToCalendar = async (event) => {
    showToast(`Event synced to your calendars!`, 'success');
  };

  const checkScheduleConflicts = (event) => {
    const conflicts = eventsData.filter(e => 
      registeredEventIds.includes(e._id) &&  // FIXED: Use _id
      e.date === event.date && 
      e._id !== event._id  // FIXED: Use _id
    );
    return conflicts;
  };

  // QR Code Functions
  const generateQRCode = (event) => {
    setSelectedQREvent(event);
    setShowQRCode(true);
  };

  // FIXED: Actually download the QR code
  const downloadQRCode = () => {
    if (!selectedQREvent) return;
    
    try {
      // Get the QR code data URL from the registration
      const registration = registeredEvents.find(
        reg => (reg.event?._id || reg.event || reg.eventId) === selectedQREvent._id
      );
      
      if (!registration || !registration.qrCode) {
        showToast('QR code not found', 'error');
        return;
      }
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = registration.qrCode; // This is the base64 data URL from backend
      link.download = `${selectedQREvent.title.replace(/[^a-z0-9]/gi, '_')}_QR.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('QR Code downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download QR code', 'error');
    }
  };


  // Certificate Functions
  const downloadCertificate = async (certificate) => {
    showToast(`Downloading certificate for ${certificate.eventName}`, 'success');
  };

  // Utility Functions
  const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-lg shadow-2xl max-w-md transform transition-all`;
    
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span class="text-${type === 'success' ? 'green' : 'red'}-600 font-bold text-xl">${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(400px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      showToast('Logging out...', 'success');
      setTimeout(() => navigate('/'), 1000);
    }
  };

  // FIXED: Corrected registration handler
  const handleRegister = async (eventId) => {
    try {
      const event = eventsData.find(e => e._id === eventId);
      
      // Check if event is closed
      if (event?.status === 'closed') {
        showToast('Registration is closed for this event', 'error');
        return;
      }
      
      console.log('Registering for event with ID:', eventId);
      const response = await registrationAPI.registerForEvent(eventId);
      
      if (response.success) {
        showToast('Successfully registered for event!', 'success');
        
        // Refresh registrations
        const registrationsResponse = await registrationAPI.getMyRegistrations();
        if (registrationsResponse.success) {
          setRegisteredEvents(registrationsResponse.registrations || []);
          
          const eventIds = (registrationsResponse.registrations || []).map(reg => {
            if (reg.event && reg.event._id) {
              return reg.event._id;
            } else if (reg.event) {
              return reg.event;
            } else if (reg.eventId) {
              return reg.eventId;
            }
            return null;
          }).filter(id => id !== null);
          
          setRegisteredEventIds(eventIds);
        }
        
        // Refresh events
        const eventsResponse = await eventAPI.getAllEvents();
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events || []);
        }

        setSelectedEvent(null);
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      showToast(errorMessage, 'error');
    }
  };

  const handleCancelRegistration = async (eventId) => {
  // Find the registration object for this event and current user
  const registration = registeredEvents.find(
    reg =>
      (reg.event?._id || reg.event) === eventId || reg.eventId === eventId
  );
  if (!registration) {
    showToast('Registration not found', 'error'); // Defensive: should never trigger now!
    return;
  }
 if (
    window.confirm(`Are you sure you want to cancel your registration for "${registration.event?.title || registration.eventId}"?`)
  ) {
    try {
      const response = await registrationAPI.cancelRegistration(registration._id);
      if (response.success) {
        showToast('Registration cancelled successfully', 'success');

        // FIX: Refresh both lists after cancelling
        const registrationsResponse = await registrationAPI.getMyRegistrations();
        if (registrationsResponse.success) {
          setRegisteredEvents(registrationsResponse.registrations || []);
          const registeredEventIds = (registrationsResponse.registrations || []).map(reg => (
            reg.event && reg.event._id ? reg.event._id : reg.eventId
          ));
          setRegisteredEventIds(registeredEventIds);
        }

        // (Optional but best) Refresh events to update registration counts
        const eventsResponse = await eventAPI.getAllEvents();
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events || []);
        }

        setSelectedEvent(null); // CLOSE the event modal if it's open
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to cancel registration',
        'error'
      );
    }
  }
};

  // FIXED: Corrected cancellation handler
  /*const handleCancelRegistration = async (eventId) => {
    const event = eventsData.find(e => e._id === eventId); // FIXED: Use _id
    
    if (window.confirm(`Cancel registration for "${event.title}"?`)) {
      try {
        const response = await registrationAPI.cancelRegistration(eventId);
        if (response.success) {
          setRegisteredEventIds(registeredEventIds.filter(id => id !== eventId));
          showToast(`Registration cancelled for "${event.title}"`, 'success');
          
          // Refresh data
          const registrationsResponse = await registrationAPI.getMyRegistrations();
          if (registrationsResponse.success) {
            setRegisteredEvents(registrationsResponse.registrations);
            const eventIds = registrationsResponse.registrations.map(reg => 
              reg.event._id || reg.event || reg.eventId
            );
            setRegisteredEventIds(eventIds);
          }
          
          const eventsResponse = await eventAPI.getAllEvents();
          if (eventsResponse.success) {
            setEventsData(eventsResponse.events);
          }
        }
      } catch (error) {
        console.error('Cancellation error:', error);
        showToast(error.response?.data?.message || 'Cancellation failed', 'error');
      }
    }
  };*/



  const markNotificationRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? {...n, read: true} : n
    ));
  };

  // Search and Filter
  const getFilteredAndSortedEvents = () => {
    let filtered = eventsData;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(e => e.category === currentFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.tags && e.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date) - new Date(b.date);
        case 'popularity':
          return b.currentRegistrations - a.currentRegistrations;
        case 'availability':
          return (b.maxParticipants - b.currentRegistrations) - (a.maxParticipants - a.currentRegistrations);
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredEvents = getFilteredAndSortedEvents();
  const myRegisteredEvents = eventsData.filter(e => registeredEventIds.includes(e._id)); // FIXED: Use _id
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Event Card Component - Update this entire component
  const EventCard = ({ event, isRegistered }) => {
    const seatsLeft = (event.maxParticipants || 0) - (event.currentRegistrations || 0);
    const seatsPercentage = event.maxParticipants ? ((event.currentRegistrations || 0) / event.maxParticipants) * 100 : 0;
    const isFull = seatsLeft === 0;
    const isClosed = event.status === 'closed'; // Check if event is closed
    
    const categoryColors = {
      technical: 'bg-blue-900 text-blue-300',
      cultural: 'bg-pink-900 text-pink-300',
      workshop: 'bg-green-900 text-green-300',
      sports: 'bg-orange-900 text-orange-300'
    };

    const categoryLabels = {
      technical: 'TECHNICAL',
      cultural: 'CULTURAL',
      workshop: 'WORKSHOP',
      sports: 'SPORTS'
    };

    return (
      <div className="bg-black rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-800 hover:border-purple-700 group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.image || 'https://via.placeholder.com/400'} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[event.category]}`}>
              {categoryLabels[event.category]}
            </span>
          </div>
          {isRegistered && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-700 text-white flex items-center gap-1">
                ✓ REGISTERED
              </span>
            </div>
          )}
          {/* Show CLOSED badge for closed events */}
          {isClosed && !isRegistered && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1">
                🔒 CLOSED
              </span>
            </div>
          )}
          {/* Show FULL badge only if event is open and full */}
          {isFull && !isRegistered && !isClosed && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg">EVENT FULL</span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors cursor-pointer">
            {event.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">📅</span>
              <span>{formatDate(event.date)} • {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">📍</span>
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">👤</span>
              <span>{event.organizer}</span>
            </div>
          </div>

          {/* Seats Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span className="font-medium">Seats: {event.currentRegistrations}/{event.maxParticipants}</span>
              <span className={`font-bold ${seatsLeft < 10 && seatsLeft > 0 ? 'text-yellow-600' : seatsLeft === 0 ? 'text-red-600' : 'text-green-700'}`}>
                {seatsLeft} left
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  seatsPercentage >= 100 ? 'bg-red-600' :
                  seatsPercentage >= 90 ? 'bg-yellow-600' : 
                  seatsPercentage >= 70 ? 'bg-yellow-600' : 
                  'bg-green-700'
                }`}
                style={{ width: `${Math.min(seatsPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => setSelectedEvent(event)}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-lg transition-all font-medium hover:shadow-lg"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };

  // Event Card Component
  {/*
  const EventCard = ({ event, isRegistered }) => {
    const seatsLeft = event.maxParticipants - event.currentRegistrations;
    const seatsPercentage = (event.currentRegistrations / event.maxParticipants) * 100;
    const isFull = seatsLeft === 0;
    
    const categoryColors = {
      technical: 'bg-blue-900 text-blue-300',
      cultural: 'bg-pink-900 text-pink-300',
      workshop: 'bg-green-900 text-green-300',
      sports: 'bg-orange-900 text-orange-300'
    };

    const categoryLabels = {
      technical: 'TECHNICAL',
      cultural: 'CULTURAL',
      workshop: 'WORKSHOP',
      sports: 'SPORTS'
    };

    return (
      <div className="bg-black rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 border-gray-800 hover:border-purple-700 group">
        <div className="relative h-48 overflow-hidden">
          <img 
            src={event.image} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 left-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryColors[event.category]}`}>
              {categoryLabels[event.category]}
            </span>
          </div>
          {isRegistered && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-700 text-white flex items-center gap-1">
                ✓ REGISTERED
              </span>
            </div>
          )}
          {isFull && !isRegistered && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-lg">EVENT FULL</span>
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-hover:text-purple-400 transition-colors cursor-pointer">
            {event.title}
          </h3>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">📅</span>
              <span>{formatDate(event.date)} • {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">📍</span>
              <span>{event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-lg">👤</span>
              <span>{event.organizer}</span>
            </div>
          </div>

          {/* Seats Progress 
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span className="font-medium">Seats: {event.currentRegistrations}/{event.maxParticipants}</span>
              <span className={`font-bold ${seatsLeft < 10 && seatsLeft > 0 ? 'text-yellow-600' : seatsLeft === 0 ? 'text-red-600' : 'text-green-700'}`}>
                {seatsLeft} left
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  seatsPercentage >= 100 ? 'bg-red-600' :
                  seatsPercentage >= 90 ? 'bg-yellow-600' : 
                  seatsPercentage >= 70 ? 'bg-yellow-600' : 
                  'bg-green-700'
                }`}
                style={{ width: `${Math.min(seatsPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          <button
            onClick={() => setSelectedEvent(event)}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-lg transition-all font-medium hover:shadow-lg"
          >
            View Details
          </button>
        </div>
      </div>
    );
  };
  */};



  return (
    <div className="min-h-screen bg-black">
      {/* Toast Container */}
      <div id="toastContainer" className="fixed top-5 right-5 z-50 flex flex-col gap-2"></div>

      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger for Mobile */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-purple-700 p-2.5 rounded-xl">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">REC Events</h1>
                <p className="text-xs text-gray-400">Student Portal</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('events')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'events' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Events
              </button>
              <button 
                onClick={() => setActiveTab('myevents')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'myevents' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                My Events
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'history' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                History
              </button>
            </nav>

            {/* Notifications & Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfileDropdown(false);
                  }}
                  className="relative p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-black rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-gray-900">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <span className="text-xs text-purple-400 font-medium">{unreadNotifications} new</span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={`p-4 border-b border-gray-800 hover:bg-gray-900 cursor-pointer transition-colors ${!notif.read ? 'bg-gray-900' : ''}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                notif.type === 'event' ? 'bg-blue-900 text-blue-300' :
                                notif.type === 'registration' ? 'bg-green-900 text-green-300' :
                                'bg-purple-700 text-white'
                              }`}>
                                {notif.type === 'event' ? '📅' : notif.type === 'registration' ? '✓' : '🏆'}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${!notif.read ? 'text-white font-medium' : 'text-gray-300'}`}>
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-purple-700 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowNotifications(false);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {userProfile.avatar}
                  </div>
                  <span className="text-white font-medium hidden sm:block">{userProfile.name.split(' ')[0]}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-black rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-purple-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-700 font-bold text-xl ">
                          {userProfile.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{userProfile.name}</h3>
                          <p className="text-sm text-purple-200">{userProfile.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Roll Number:</span>
                        <span className="text-white font-medium">{userProfile.rollNumber}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Department:</span>
                        <span className="text-white font-medium">{userProfile.department}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Semester:</span>
                        <span className="text-white font-medium">{userProfile.semester}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white font-medium">{userProfile.phone}</span>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-800 space-y-2">
                      <button 
                        onClick={() => setShowCalendarSync(true)}
                        className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Calendar Settings
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors font-medium"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileNavOpen && (
        <div className="fixed z-50 inset-0 bg-black bg-opacity-70 flex md:hidden">
          <div className="bg-gray-900 w-3/4 max-w-xs h-full p-6 flex flex-col space-y-6 shadow-xl">
            <button
              className="self-end p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <button
              className="w-full text-left py-3 px-2 rounded-lg text-white font-medium text-lg bg-purple-600 mb-1"
              onClick={() => {
                setActiveTab('events');
                setMobileNavOpen(false);
              }}
            >
              Events
            </button>
            <button
              className="w-full text-left py-3 px-2 rounded-lg text-white font-medium text-lg hover:bg-purple-800 transition"
              onClick={() => {
                setActiveTab('myevents');
                setMobileNavOpen(false);
              }}
            >
              My Registrations
            </button>
            <button
              className="w-full text-left py-3 px-2 rounded-lg text-white font-medium text-lg hover:bg-purple-800 transition"
              onClick={() => {
                setActiveTab('history');
                setMobileNavOpen(false);
              }}
            >
              Certificates
            </button>
            <button
              className="w-full text-left py-3 px-2 rounded-lg text-red-400 font-medium text-lg mt-auto"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'events' && (
          <>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl p-8 mb-8 shadow-xl">
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome back, {userProfile.name}! 👋  {/* FIXED: Show full name instead of split */}
              </h2>
              <p className="text-purple-100">
                Explore and register for exciting events happening at REC
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Events</p>
                    <p className="text-white text-2xl font-bold">{stats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-green-700 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Registered</p>
                    <p className="text-white text-2xl font-bold">{stats.registeredEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-700 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Certificates</p>
                    <p className="text-white text-2xl font-bold">{stats.certificates}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-600 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Notifications</p>
                    <p className="text-white text-2xl font-bold">{unreadNotifications}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-black rounded-xl p-1 mb-8 border border-gray-800 overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                <button 
                  onClick={() => setCurrentFilter('all')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentFilter === 'all' 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  All Events
                </button>
                <button 
                  onClick={() => setCurrentFilter('technical')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentFilter === 'technical' 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Technical
                </button>
                <button 
                  onClick={() => setCurrentFilter('cultural')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentFilter === 'cultural' 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Cultural
                </button>
                <button 
                  onClick={() => setCurrentFilter('workshop')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentFilter === 'workshop' 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Workshops
                </button>
                <button 
                  onClick={() => setCurrentFilter('sports')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    currentFilter === 'sports' 
                      ? 'bg-purple-700 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  Sports
                </button>
              </div>
            </div>

            {/* Search and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search events by name, organizer, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black text-white px-4 py-3 pl-12 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors placeholder-gray-500"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors cursor-pointer"
              >
                <option value="date">Sort by Date</option>
                <option value="popularity">Sort by Popularity</option>
                <option value="availability">Sort by Availability</option>
              </select>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="bg-black rounded-2xl p-16 text-center border border-gray-800">
                <div className="text-7xl mb-4 opacity-50">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No events found</h3>
                <p className="text-gray-400">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard 
                    key={event._id}  // FIXED: Use _id
                    event={event} 
                    isRegistered={registeredEventIds.includes(event._id)}  // FIXED: Use _id
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'myevents' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">My Registrations</h2>
              <p className="text-gray-400">Events you're registered for</p>
            </div>

            {myRegisteredEvents.length === 0 ? (
              <div className="bg-black rounded-2xl p-16 text-center border border-gray-800">
                <div className="text-7xl mb-4 opacity-50">📅</div>
                <h3 className="text-2xl font-bold text-white mb-2">No registrations yet</h3>
                <p className="text-gray-400 mb-6">Start exploring and register for exciting events!</p>
                <button
                  onClick={() => setActiveTab('events')}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Browse Events
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRegisteredEvents.map(event => (
                  <div key={event._id} className="bg-black rounded-xl overflow-hidden border-2 border-gray-800 hover:border-purple-700 transition-all">  {/* FIXED: Use _id */}
                    <div className="relative h-48">
                      <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-700 text-white">
                          ✓ REGISTERED
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <span>📅</span>
                          <span>{formatDate(event.date)} • {event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <span>📍</span>
                          <span>{event.venue}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generateQRCode(event)}
                          className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          View QR Code
                        </button>
                        <button
                          onClick={() => handleCancelRegistration(event._id)}  
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Event History</h2>
              <p className="text-gray-400">Your past events and certificates</p>
            </div>

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4">Available Certificates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map(cert => (
                    <div key={cert.id} className="bg-black rounded-xl p-6 border-2 border-gray-800 hover:border-purple-700 transition-all">
                      <div className="text-5xl mb-4">🏆</div>
                      <h3 className="text-lg font-bold text-white mb-2">{cert.eventName}</h3>
                      <p className="text-sm text-gray-400 mb-4">Issued on {formatDate(cert.issueDate)}</p>
                      <button
                        onClick={() => downloadCertificate(cert)}
                        className="w-full bg-purple-700 hover:bg-purple-800 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Certificate
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event History Table */}
            {eventHistory.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Past Events</h3>
                <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Event</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {eventHistory.map(event => (
                          <tr key={event.id} className="hover:bg-gray-900 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-white font-medium">{event.title}</p>
                                <p className="text-sm text-gray-400">{event.organizer}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{formatDate(event.date)}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                                {event.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                event.attended 
                                  ? 'bg-green-900 text-green-300' 
                                  : 'bg-red-900 text-red-300'
                              }`}>
                                {event.attended ? 'Attended' : 'Missed'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {event.certificateAvailable ? (
                                <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                                  Download
                                </button>
                              ) : (
                                <span className="text-gray-500 text-sm">Not Available</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-black rounded-2xl p-16 text-center border border-gray-800">
                <div className="text-7xl mb-4 opacity-50">📜</div>
                <h3 className="text-2xl font-bold text-white mb-2">No event history</h3>
                <p className="text-gray-400">Your attended events will appear here</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-800 shadow-2xl">
            <div className="relative h-64 sm:h-80">
              <img 
                src={selectedEvent.image} 
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 sm:p-8">
              <h2 className="text-3xl font-bold text-white mb-4">{selectedEvent.title}</h2>
              <p className="text-gray-300 mb-6 leading-relaxed">{selectedEvent.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">📅 Date & Time</p>
                  <p className="text-white font-medium">{formatDate(selectedEvent.date)}</p>
                  <p className="text-gray-300">{selectedEvent.time}</p>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">📍 Venue</p>
                  <p className="text-white font-medium">{selectedEvent.venue}</p>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">👤 Organizer</p>
                  <p className="text-white font-medium">{selectedEvent.organizer}</p>
                </div>
                
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">🎫 Seats Available</p>
                  <p className="text-white font-medium">
                    {selectedEvent.maxParticipants - selectedEvent.currentRegistrations} / {selectedEvent.maxParticipants}
                  </p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">⏱️ Duration</p>
                  <p className="text-white font-medium">{selectedEvent.duration}</p>
                </div>

                <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">📚 Prerequisites</p>
                  <p className="text-white font-medium">{selectedEvent.prerequisites}</p>
                </div>
              </div>

              {/* Tags */}
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-3 font-medium">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.tags.map((tag, idx) => (
                      <span key={idx} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm font-medium border border-gray-700">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar Sync Notice */}
              {Object.values(calendarConnections).some(v => v) && (
                <div className="mb-6 bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                  <p className="text-purple-300 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This event will be automatically synced to your connected calendars after registration
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                {registeredEventIds.includes(selectedEvent._id) ? (  // FIXED: Use _id
                  <>
                    <button
                      onClick={() => generateQRCode(selectedEvent)}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      View QR Code
                    </button>
                    <button
                      onClick={() => handleCancelRegistration(selectedEvent._id)}  // FIXED: Use _id
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      Cancel Registration
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleRegister(selectedEvent._id)}  // FIXED: Use _id
                    disabled={selectedEvent.maxParticipants - selectedEvent.currentRegistrations === 0}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      selectedEvent.maxParticipants - selectedEvent.currentRegistrations === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                  >
                    {selectedEvent.maxParticipants - selectedEvent.currentRegistrations === 0 ? 'Event Full' : 'Register Now'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRCode && selectedQREvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl max-w-md w-full border-2 border-gray-800 shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Event QR Code</h3>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-8 text-center">
              {/* FIXED: Display actual QR code from backend */}
              {(() => {
                const registration = registeredEvents.find(
                  reg => (reg.event?._id || reg.event || reg.eventId) === selectedQREvent._id
                );
                return registration?.qrCode ? (
                  <div className="bg-white p-6 rounded-xl inline-block mb-4">
                    <img 
                      src={registration.qrCode} 
                      alt="Event QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl inline-block mb-4">
                    <div className="w-64 h-64 flex items-center justify-center text-gray-400">
                      <p>QR Code not available</p>
                    </div>
                  </div>
                );
              })()}
              
              <h4 className="text-lg font-semibold text-white mb-2">{selectedQREvent.title}</h4>
              <p className="text-gray-400 text-sm mb-1">{formatDate(selectedQREvent.date)} • {selectedQREvent.time}</p>
              <p className="text-gray-400 text-sm mb-6">{selectedQREvent.venue}</p>
              <p className="text-gray-500 text-xs mb-6">Show this QR code at the event entrance for check-in</p>
              
              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Download QR Code
                </button>
                <button
                  onClick={() => setShowQRCode(false)}
                  className="px-6 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Sync Modal */}
      {showCalendarSync && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl max-w-lg w-full border-2 border-gray-800 shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Calendar Integration</h3>
                <button
                  onClick={() => setShowCalendarSync(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-6">Connect your calendars to automatically sync registered events and detect schedule conflicts.</p>
              
              <div className="space-y-4">
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Google Calendar</p>
                      <p className="text-sm text-gray-400">
                        {calendarConnections.google ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => connectCalendar('google')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      calendarConnections.google
                        ? 'bg-green-900 text-green-300 cursor-default'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                    disabled={calendarConnections.google}
                  >
                    {calendarConnections.google ? '✓ Connected' : 'Connect'}
                  </button>
                </div>

                {/* Outlook Calendar */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">O</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Outlook Calendar</p>
                      <p className="text-sm text-gray-400">
                        {calendarConnections.outlook ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => connectCalendar('outlook')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      calendarConnections.outlook
                        ? 'bg-green-900 text-green-300 cursor-default'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                    disabled={calendarConnections.outlook}
                  >
                    {calendarConnections.outlook ? '✓ Connected' : 'Connect'}
                  </button>
                </div>

                {/* Apple Calendar */}
                <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">🍎</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Apple Calendar</p>
                      <p className="text-sm text-gray-400">
                        {calendarConnections.apple ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => connectCalendar('apple')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      calendarConnections.apple
                        ? 'bg-green-900 text-green-300 cursor-default'
                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                    }`}
                    disabled={calendarConnections.apple}
                  >
                    {calendarConnections.apple ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              </div>

              {/* Features Info */}
              <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
                <p className="text-purple-300 text-sm font-medium mb-2">Calendar Integration Features:</p>
                <ul className="text-purple-300 text-sm space-y-1">
                  <li>• Automatic event sync after registration</li>
                  <li>• Real-time conflict detection</li>
                  <li>• Event reminders and notifications</li>
                  <li>• Schedule optimization suggestions</li>
                </ul>
              </div>

              <button
                onClick={() => setShowCalendarSync(false)}
                className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
