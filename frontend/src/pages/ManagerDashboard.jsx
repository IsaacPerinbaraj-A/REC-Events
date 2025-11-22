import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../services/api';
import { getUser, logout } from '../utils/auth';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  
  // Navigation / View State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'events', 'analytics', 'attendees'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, open, closed, cancelled

  // Manager Profile
  const [managerProfile, setManagerProfile] = useState({
    name: "Admin Manager",
    email: "manager@rec.edu",
    role: "Event Manager",
    department: "Administration",
    phone: "+91 9876543210",
    avatar: "AM"
  });

  // Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: "15 new registrations for AI Workshop", time: "10 mins ago", read: false },
    { id: 2, message: "Event 'Cultural Fest' registration limit reached", time: "1 hour ago", read: false },
    { id: 3, message: "5 attendees checked in for Python Bootcamp", time: "2 hours ago", read: true }
  ]);

  // FIXED: Start with empty array - will be populated from backend
  const [eventsData, setEventsData] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    activeEvents: 0,
    avgRegistration: 0
  });

  // Attendees (mock data - replace with real API call)
  const [attendeesData, setAttendeesData] = useState([]);

  // Form state for creating/editing events
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    date: '',
    time: '',
    venue: '',
    maxParticipants: '',
    organizer: '',
    image: '',
    tags: '',
    department: '',
    duration: '',
    prerequisites: ''
  });

  // CSV Export Function
  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export Function (using HTML table method)
  const exportToExcel = (data, filename, eventInfo) => {
    if (!data || data.length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    const headers = Object.keys(data[0]);
    
    // Create HTML table with styling
    let html = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
            .header-info { margin-bottom: 20px; font-size: 14px; }
            .header-info h2 { margin: 5px 0; color: #333; }
            .header-info p { margin: 3px 0; color: #666; }
            th { background-color: #7c3aed; color: white; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            tr:hover { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h2>${eventInfo.title}</h2>
            <p><strong>Date:</strong> ${new Date(eventInfo.date).toLocaleDateString('en-IN')}</p>
            <p><strong>Venue:</strong> ${eventInfo.venue}</p>
            <p><strong>Total Attendees:</strong> ${data.length}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString('en-IN')}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Export
  const handleExportAttendees = async (eventId, format = 'csv') => {
    try {
      const event = eventsData.find(e => e._id === eventId);
      if (!event) {
        showToast('Event not found', 'error');
        return;
      }

      showToast('Preparing export...', 'info');
      
      const response = await registrationAPI.exportEventAttendees(eventId);
      
      if (response.success && response.attendees.length > 0) {
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitizedTitle = event.title.replace(/[^a-z0-9]/gi, '_');
        
        if (format === 'csv') {
          const filename = `${sanitizedTitle}_Attendees_${timestamp}.csv`;
          exportToCSV(response.attendees, filename);
          showToast(`CSV exported successfully! (${response.count} attendees)`, 'success');
        } else if (format === 'excel') {
          const filename = `${sanitizedTitle}_Attendees_${timestamp}.xls`;
          exportToExcel(response.attendees, filename, response.event);
          showToast(`Excel exported successfully! (${response.count} attendees)`, 'success');
        }
      } else {
        showToast('No attendees to export', 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      showToast(error.response?.data?.message || 'Failed to export attendees', 'error');
    }
  };


  // FIXED: Fetch real data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user data
        const userData = getUser();
        if (userData) {
          setManagerProfile({
            name: userData.name || 'Admin Manager',
            email: userData.email || 'manager@rec.edu',
            role: userData.role || 'Event Manager',
            department: userData.department || 'Administration',
            phone: userData.phone || '+91 9876543210',
            avatar: userData.name?.split(' ').map(n => n[0]).join('') || ' '
          });
        }

        // Fetch manager's events
        const eventsResponse = await eventAPI.getMyEvents();
        
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events || []); // FIXED: Use backend data
          
          // Calculate stats
          const events = eventsResponse.events || [];
          const totalRegs = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
          const activeEvents = events.filter(e => e.status === 'open').length;
          
          setStats({
            totalEvents: events.length,
            totalRegistrations: totalRegs,
            activeEvents: activeEvents,
            avgRegistration: events.length > 0 ? (totalRegs / events.length) : 0
          });
        }

        // Fetch all registrations for attendee view
        // You may need to add this endpoint to your backend
        // const attendeesResponse = await registrationAPI.getAllRegistrations();
        // if (attendeesResponse.success) {
        //   setAttendeesData(attendeesResponse.registrations);
        // }

      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Error loading data', 'error');
      }
    };

    fetchData();
  }, []);

  // Utility Functions
  const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 bg-white text-gray-900 px-6 py-4 rounded-lg shadow-2xl max-w-md transform transition-all`;
    
    let icon, iconColor;
    if (type === 'success') {
      icon = '✓';
      iconColor = 'text-green-600';
    } else if (type === 'error') {
      icon = '✕';
      iconColor = 'text-red-600';
    } else if (type === 'info') {
      icon = 'ℹ';
      iconColor = 'text-blue-600';
    }
    
    toast.innerHTML = `<span class="${iconColor} font-bold text-xl">${icon}</span><span>${message}</span>`;
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
      setTimeout(() => navigate('/login'), 1000);
    }
  };

  const markNotificationRead = (notificationId) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? {...n, read: true} : n
    ));
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'technical',
      date: '',
      time: '',
      venue: '',
      maxParticipants: '',
      organizer: '',
      image: '',
      tags: '',
      department: '',
      duration: '',
      prerequisites: ''
    });
  };

  // FIXED: Create event handler
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    try {
      // Convert tags string to array
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      const response = await eventAPI.createEvent(eventData);
      
      if (response.success) {
        showToast(`Event "${formData.title}" created successfully!`, 'success');
        setShowCreateModal(false);
        resetForm();
        
        // Refresh events list
        const eventsResponse = await eventAPI.getMyEvents();
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events || []);
          
          // Update stats
          const events = eventsResponse.events || [];
          const totalRegs = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
          const activeEvents = events.filter(e => e.status === 'open').length;
          
          setStats({
            totalEvents: events.length,
            totalRegistrations: totalRegs,
            activeEvents: activeEvents,
            avgRegistration: events.length > 0 ? (totalRegs / events.length) : 0
          });
        }
      }
    } catch (error) {
      console.error('Create event error:', error);
      showToast(error.response?.data?.message || 'Failed to create event', 'error');
    }
  };

  // FIXED: Update event handler
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        maxParticipants: parseInt(formData.maxParticipants),
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };

      const response = await eventAPI.updateEvent(selectedEvent._id, eventData); // FIXED: Use _id
      
      if (response.success) {
        showToast(`Event "${formData.title}" updated successfully!`, 'success');
        setShowEditModal(false);
        setSelectedEvent(null);
        resetForm();
        
        // Refresh events
        const eventsResponse = await eventAPI.getMyEvents();
        if (eventsResponse.success) {
          setEventsData(eventsResponse.events || []);
        }
      }
    } catch (error) {
      console.error('Update event error:', error);
      showToast(error.response?.data?.message || 'Failed to update event', 'error');
    }
  };

  // FIXED: Delete event handler
  const handleDeleteEvent = async (eventId) => {
    const event = eventsData.find(e => e._id === eventId); // FIXED: Use _id
    
    if (window.confirm(`Are you sure you want to delete "${event?.title}"? This action cannot be undone.`)) {
      try {
        const response = await eventAPI.deleteEvent(eventId);
        
        if (response.success) {
          showToast(`Event "${event?.title}" deleted successfully!`, 'success');
          
          // Refresh events
          const eventsResponse = await eventAPI.getMyEvents();
          if (eventsResponse.success) {
            setEventsData(eventsResponse.events || []);
            
            // Update stats
            const events = eventsResponse.events || [];
            const totalRegs = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
            const activeEvents = events.filter(e => e.status === 'open').length;
            
            setStats({
              totalEvents: events.length,
              totalRegistrations: totalRegs,
              activeEvents: activeEvents,
              avgRegistration: events.length > 0 ? (totalRegs / events.length) : 0
            });
          }
        }
      } catch (error) {
        console.error('Delete error:', error);
        showToast(error.response?.data?.message || 'Failed to delete event', 'error');
      }
    }
  };

  // FIXED: Close event handler
  const handleCloseEvent = async (eventId) => {
    const event = eventsData.find(e => e._id === eventId); // FIXED: Use _id
    
    if (window.confirm(`Close registrations for "${event?.title}"?`)) {
      try {
        const response = await eventAPI.closeEvent(eventId);
        
        if (response.success) {
          showToast(`Event "${event?.title}" closed successfully!`, 'success');
          
          // Refresh events
          const eventsResponse = await eventAPI.getMyEvents();
          if (eventsResponse.success) {
            setEventsData(eventsResponse.events || []);
          }
        }
      } catch (error) {
        console.error('Close event error:', error);
        showToast(error.response?.data?.message || 'Failed to close event', 'error');
      }
    }
  };

  // FIXED: Open edit modal
  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      category: event.category || 'technical',
      date: event.date || '',
      time: event.time || '',
      venue: event.venue || '',
      maxParticipants: event.maxParticipants || '',
      organizer: event.organizer || '',
      image: event.image || '',
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
      department: event.department || '',
      duration: event.duration || '',
      prerequisites: event.prerequisites || ''
    });
    setShowEditModal(true);
  };

  // View attendees for an event
  const viewAttendees = async (eventId) => {
    try {
      const response = await registrationAPI.getEventAttendees(eventId);
      if (response.success) {
        setAttendeesData(response.attendees);
        setActiveTab('attendees');
      }
    } catch (error) {
      console.error('Error fetching attendees:', error);
      showToast('Failed to load attendees', 'error');
    }
  };

  // Filter events
  const getFilteredEvents = () => {
    let filtered = eventsData;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.organizer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredEvents = getFilteredEvents();
  const recentEvents = eventsData.slice(0, 5); // Show latest 5 events on dashboard
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Analytics data
  const topEvents = [...eventsData]
    .sort((a, b) => (b.currentRegistrations || 0) - (a.currentRegistrations || 0))
    .slice(0, 5)
    .map(e => ({
      name: e.title,
      registrations: e.currentRegistrations || 0
    }));

  const eventsByCategory = ['technical', 'cultural', 'workshop', 'sports'].map(category => {
    const count = eventsData.filter(e => e.category === category).length;
    const percentage = eventsData.length > 0 ? (count / eventsData.length * 100).toFixed(1) : 0;
    return { category, count, percentage };
  });

  // Add this function near your other event handlers
  const handleReopenEvent = async (eventId) => {
    const event = eventsData.find(e => e._id === eventId);
    
    if (window.confirm(`Reopen registrations for "${event?.title}"?`)) {
      try {
        const response = await eventAPI.reopenEvent(eventId);
        
        if (response.success) {
          showToast(`Event "${event?.title}" reopened successfully!`, 'success');
          
          // Refresh events
          const eventsResponse = await eventAPI.getMyEvents();
          if (eventsResponse.success) {
            setEventsData(eventsResponse.events || []);
          }
        }
      } catch (error) {
        console.error('Reopen event error:', error);
        showToast(error.response?.data?.message || 'Failed to reopen event', 'error');
      }
    }
  };


  return (
    <div className="min-h-screen bg-black">
      {/* Toast Container */}
      <div id="toastContainer" className="fixed top-5 right-5 z-50 flex flex-col gap-2"></div>

      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-purple-700 p-2.5 rounded-xl">
                <span className="text-white font-bold text-xl">R</span>

              </div>
              <div>
                <h1 className="text-xl font-bold text-white">REC Events</h1>
                <p className="text-xs text-gray-400">Manager Portal</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'dashboard' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
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
                onClick={() => setActiveTab('attendees')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'attendees' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Attendees
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'analytics' 
                    ? 'text-white border-b-2 border-purple-700' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Analytics
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
                              <div className="p-2 rounded-lg bg-purple-700 text-white">
                                📊
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
                    {managerProfile.avatar}
                  </div>
                  <span className="text-white font-medium hidden sm:block">{managerProfile.name.split(' ')[0]}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-black rounded-xl shadow-2xl border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-purple-700">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-purple-700 font-bold text-xl">
                          {managerProfile.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{managerProfile.name}</h3>
                          <p className="text-sm text-purple-200">{managerProfile.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Role:</span>
                        <span className="text-white font-medium">{managerProfile.role}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Department:</span>
                        <span className="text-white font-medium">{managerProfile.department}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-400">Phone:</span>
                        <span className="text-white font-medium">{managerProfile.phone}</span>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-800">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-2xl p-8 mb-8 shadow-xl">
              <h2 className="text-3xl font-bold text-white mb-2">
                Manager Dashboard 📊
              </h2>
              <p className="text-purple-100">
                Manage events and track registrations
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Registrations</p>
                    <p className="text-white text-2xl font-bold">{stats.totalRegistrations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-purple-700 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Active Events</p>
                    <p className="text-white text-2xl font-bold">{stats.activeEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black rounded-xl p-6 border border-gray-800 hover:border-purple-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-yellow-600 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Avg. Registration</p>
                    <p className="text-white text-2xl font-bold">{stats.avgRegistration.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white p-6 rounded-xl transition-all hover:shadow-xl flex items-center gap-4"
                >
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Create New Event</p>
                    <p className="text-sm text-purple-200">Add a new event</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('events')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl transition-all hover:shadow-xl flex items-center gap-4"
                >
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Manage Events</p>
                    <p className="text-sm text-blue-200">Edit or delete events</p>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveTab('attendees')}
                  className="bg-green-700 hover:bg-green-800 text-white p-6 rounded-xl transition-all hover:shadow-xl flex items-center gap-4"
                >
                  <div className="bg-white/20 p-3 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">View Attendees</p>
                    <p className="text-sm text-green-200">Check registrations</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Events Table */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Recent Events</h3>
              <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Event</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registrations</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {recentEvents.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                            No events found. Create your first event!
                          </td>
                        </tr>
                      ) : (
                        recentEvents.map(event => (
                          <tr key={event._id} className="hover:bg-gray-900 transition-colors">  {/* FIXED: Use _id */}
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-white font-medium">{event.title}</p>
                                <p className="text-sm text-gray-400">{event.organizer}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                                {event.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {formatDate(event.date)}
                              <br />
                              <span className="text-sm text-gray-500">{event.time}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-white font-medium">{event.currentRegistrations}/{event.maxParticipants}</p>
                                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                                  <div 
                                    className={`h-1.5 rounded-full ${
                                      (event.currentRegistrations / event.maxParticipants) * 100 >= 90 ? 'bg-red-600' :
                                      (event.currentRegistrations / event.maxParticipants) * 100 >= 70 ? 'bg-yellow-600' : 
                                      'bg-green-700'
                                    }`}
                                    style={{ width: `${(event.currentRegistrations / event.maxParticipants) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                event.status === 'open' ? 'bg-green-900 text-green-300' :
                                event.status === 'closed' ? 'bg-gray-700 text-gray-300' :
                                'bg-red-900 text-red-300'
                              }`}>
                                {event.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => viewAttendees(event._id)}  
                                className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                              >
                                View Attendees
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Events Management Tab */}
        {activeTab === 'events' && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">Manage Events</h2>
                  <p className="text-gray-400">Create, edit, and manage your events</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Create Event
                </button>
              </div>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black text-white px-4 py-3 pl-12 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors placeholder-gray-500"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-black text-white px-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Events Table */}
            <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Event</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registrations</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                          No events found
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map(event => (
                        <tr key={event._id} className="hover:bg-gray-900 transition-colors">  {/* FIXED: Use _id */}
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{event.title}</p>
                              <p className="text-sm text-gray-400">{event.organizer}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                              {event.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {formatDate(event.date)}
                            <br />
                            <span className="text-sm text-gray-500">{event.time}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-white font-medium">{event.currentRegistrations}/{event.maxParticipants}</p>
                              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    (event.currentRegistrations / event.maxParticipants) * 100 >= 90 ? 'bg-red-600' :
                                    (event.currentRegistrations / event.maxParticipants) * 100 >= 70 ? 'bg-yellow-600' : 
                                    'bg-green-700'
                                  }`}
                                  style={{ width: `${(event.currentRegistrations / event.maxParticipants) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              event.status === 'open' ? 'bg-green-900 text-green-300' :
                              event.status === 'closed' ? 'bg-gray-700 text-gray-300' :
                              'bg-red-900 text-red-300'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">



                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openEditModal(event)}
                                  className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-800 rounded"
                                  title="Edit"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                
                                {event.status === 'open' ? (
                                  <button
                                    onClick={() => handleCloseEvent(event._id)}
                                    className="text-yellow-400 hover:text-yellow-300 p-2 hover:bg-gray-800 rounded"
                                    title="Close Registrations"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                  </button>
                                ) : event.status === 'closed' ? (
                                  <button
                                    onClick={() => handleReopenEvent(event._id)}
                                    className="text-green-400 hover:text-green-300 p-2 hover:bg-gray-800 rounded"
                                    title="Reopen Registrations"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                ) : null}


                                {/* View Attendees Button */}
                                <button
                                  onClick={() => viewAttendees(event._id)}
                                  className="text-purple-400 hover:text-purple-300 p-2 hover:bg-gray-800 rounded transition-colors"
                                  title="View Attendees"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </button>
                                
                                {/* NEW: Export Dropdown Button */}
                                <div className="relative group">
                                  <button
                                    className="text-green-400 hover:text-green-300 p-2 hover:bg-gray-800 rounded transition-colors"
                                    title="Export Attendees"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </button>
                                  
                                  {/* Export Dropdown Menu */}
                                  <div className="absolute right-0 mt-1 w-36 bg-gray-900 rounded-lg shadow-xl border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                    <button
                                      onClick={() => handleExportAttendees(event._id, 'csv')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-t-lg flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      Export CSV
                                    </button>
                                    <button
                                      onClick={() => handleExportAttendees(event._id, 'excel')}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-b-lg flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      Export Excel
                                    </button>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDeleteEvent(event._id)}
                                  className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-800 rounded"
                                  title="Delete"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Attendee Management</h2>
              <p className="text-gray-400">View and manage event registrations</p>
            </div>

            <div className="bg-black rounded-xl overflow-hidden border border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Roll No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Event</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registered On</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {attendeesData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                          No attendees found. Select an event to view registrations.
                        </td>
                      </tr>
                    ) : (
                      attendeesData.map((attendee, index) => (
                        <tr key={index} className="hover:bg-gray-900 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                                {attendee.name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-white font-medium">{attendee.name}</p>
                                <p className="text-sm text-gray-400">{attendee.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{attendee.rollNumber}</td>
                          <td className="px-6 py-4 text-gray-300">{attendee.eventName}</td>
                          <td className="px-6 py-4 text-gray-300">{formatDate(attendee.registeredAt)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              attendee.status === 'attended' ? 'bg-green-900 text-green-300' :
                              attendee.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                              'bg-blue-900 text-blue-300'
                            }`}>
                              {attendee.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Analytics & Insights</h2>
              <p className="text-gray-400">Track performance and trends</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Events */}
              <div className="bg-black rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-6">Top Events by Registrations</h3>
                <div className="space-y-4">
                  {topEvents.map((event, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{event.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-gray-800 rounded-full h-2">
                            <div 
                              className="bg-purple-700 h-2 rounded-full"
                              style={{ width: `${(event.registrations / (topEvents[0]?.registrations || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-400 w-16 text-right">{event.registrations}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Distribution */}
              <div className="bg-black rounded-xl p-6 border border-gray-800">
                <h3 className="text-xl font-bold text-white mb-6">Event Distribution by Category</h3>
                <div className="space-y-4">
                  {eventsByCategory.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-900 rounded-lg">
                      <div>
                        <p className="text-white font-medium capitalize">{cat.category}</p>
                        <p className="text-sm text-gray-400">{cat.count} events</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">{cat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-800 shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Create New Event</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="Enter event title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors resize-none"
                    placeholder="Event description"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors cursor-pointer"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="workshop">Workshop</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="Event venue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants *</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organizer *</label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="Organizer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="2 hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="Computer Science"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="AI, Machine Learning, Workshop"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prerequisites</label>
                  <input
                    type="text"
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                    placeholder="None"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Create Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal - Same structure as Create Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-800 shadow-2xl">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Edit Event</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
              {/* Same form fields as Create Modal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors cursor-pointer"
                  >
                    <option value="technical">Technical</option>
                    <option value="cultural">Cultural</option>
                    <option value="workshop">Workshop</option>
                    <option value="sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Max Participants *</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organizer *</label>
                  <input
                    type="text"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Prerequisites</label>
                  <input
                    type="text"
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleInputChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-700 transition-colors"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Update Event
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEvent(null);
                    resetForm();
                  }}
                  className="px-8 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
