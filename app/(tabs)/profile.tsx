import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User,
  Bell,
  Settings,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
  Moon,
  Smartphone,
  Globe,
  Mail,
  MapPin
} from 'lucide-react-native';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [locationEnabled, setLocationEnabled] = React.useState(true);

  const notifications = [
    { id: 1, title: 'Task Assignment', message: 'You have been assigned: "Construct 4 ft. RCC pillars"', time: '2m ago', unread: true },
    { id: 2, title: 'Evidence Approved', message: 'Your evidence for "Stack top soil" has been approved', time: '1h ago', unread: true },
    { id: 3, title: 'AI Analysis Complete', message: 'AI analysis completed on submitted evidence', time: '2h ago', unread: false },
  ];

  const menuItems = [
    { icon: User, title: 'Edit Profile', subtitle: 'Update your information' },
    { icon: Camera, title: 'Camera Settings', subtitle: 'Configure capture preferences' },
    { icon: Shield, title: 'Privacy & Security', subtitle: 'Manage your privacy settings' },
    { icon: HelpCircle, title: 'Help & Support', subtitle: 'Get help and contact support' },
    { icon: Globe, title: 'Language', subtitle: 'English' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>Mobile User</Text>
          <Text style={styles.userRole}>Compliance Officer</Text>
          <Text style={styles.userLocation}>
            <MapPin size={14} color="#6B7280" />
            {' '}Topailore Mine, Jharkhand
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Camera size={24} color="#3B82F6" />
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statCard}>
            <Bell size={24} color="#10B981" />
            <Text style={styles.statNumber}>{notifications.filter(n => n.unread).length}</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
          <View style={styles.statCard}>
            <Settings size={24} color="#F59E0B" />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Settings</Text>
          </View>
        </View>

        {/* Recent Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.slice(0, 3).map((notification) => (
            <TouchableOpacity key={notification.id} style={styles.notificationItem}>
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
              </View>
              {notification.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Notifications</Text>
            <ChevronRight size={16} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>Receive task updates and alerts</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Moon size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Dark Mode</Text>
                <Text style={styles.settingSubtitle}>Switch to dark theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={darkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <MapPin size={20} color="#6B7280" />
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Location Services</Text>
                <Text style={styles.settingSubtitle}>Enable GPS for compliance photos</Text>
              </View>
            </View>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={locationEnabled ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem}>
              <View style={styles.menuContent}>
                <item.icon size={20} color="#6B7280" />
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Camsure Mobile v1.0.0</Text>
          <Text style={styles.appInfoText}>SAIL Environmental Compliance</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  userLocation: {
    fontSize: 14,
    color: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
}); 