import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

const features = [
  {
    icon: 'flash',
    title: 'Entropy Analysis',
    description: 'Advanced entropy-based processing for optimal problem decomposition',
  },
  {
    icon: 'cube',
    title: 'Quaternion Encoding',
    description: '4D semantic representation for enhanced contextual understanding',
  },
  {
    icon: 'git-network',
    title: 'Neural Pruning',
    description: 'Intelligent response optimization through neural network pruning',
  },
  {
    icon: 'people',
    title: 'Multi-Agent Consensus',
    description: 'Vicsek-inspired consensus for reliable multi-perspective analysis',
  },
  {
    icon: 'image',
    title: 'Image Generation',
    description: 'Create stunning visuals with DALL-E integration',
  },
  {
    icon: 'scan',
    title: 'OCR Analysis',
    description: 'Extract and analyze text from images with multi-agent consensus',
  },
];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <LinearGradient
        colors={['#0a1a0a', '#0d2818', '#0a1a0a']}
        style={styles.hero}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.badge}>
          <Ionicons name="checkmark-circle" size={14} color="#FFD700" />
          <Text style={styles.badgeText}>Powered by AIModelG3</Text>
        </View>

        <Text style={styles.heroTitle}>REOP-AI</Text>
        <Text style={styles.heroSubtitle}>
          A unified operator framework for geometry, entropy dynamics, and
          recursive state systems. Powered by quaternion semantic encoding and
          multi-agent consensus.
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Chat')}
          >
            <Ionicons name="chatbubbles" size={20} color="#0a1a0a" />
            <Text style={styles.primaryButtonText}>Open Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Architecture')}
          >
            <Ionicons name="cube-outline" size={20} color="#50C878" />
            <Text style={styles.secondaryButtonText}>View Architecture</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Core Capabilities</Text>
        <Text style={styles.sectionSubtitle}>
          Advanced AI architecture for complex problem solving
        </Text>

        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <LinearGradient
                colors={['rgba(80, 200, 120, 0.1)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.featureIconContainer}
              >
                <Ionicons name={feature.icon as any} size={24} color="#50C878" />
              </LinearGradient>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Section */}
      <LinearGradient
        colors={['#0d2818', '#0a1a0a']}
        style={styles.statsSection}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>6</Text>
            <Text style={styles.statLabel}>Processing Regimes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4D</Text>
            <Text style={styles.statLabel}>Quaternion Encoding</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>∞</Text>
            <Text style={styles.statLabel}>Entropy Analysis</Text>
          </View>
        </View>
      </LinearGradient>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Ready to Experience AIModelG3?</Text>
        <Text style={styles.ctaSubtitle}>
          Start a conversation and explore the full potential of our advanced AI architecture.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.ctaButtonText}>Start New Chat</Text>
          <Ionicons name="arrow-forward" size={20} color="#0a1a0a" />
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 REOP Solutions. All rights reserved.</Text>
        <Text style={styles.footerVersion}>Version 2.0.0</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://entropy-physics-ai.com')}>
          <Text style={styles.footerLink}>entropy-physics-ai.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1a0a',
  },
  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#0d1f0d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#50C878',
  },
  logo: {
    width: 80,
    height: 80,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    letterSpacing: 2,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#0a1a0a',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#50C878',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#50C878',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: (width - 50) / 2,
    backgroundColor: '#0d1f0d',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1a3a1a',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 13,
    color: '#a0a0a0',
    lineHeight: 18,
  },
  statsSection: {
    padding: 30,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#a0a0a0',
    textAlign: 'center',
  },
  ctaSection: {
    padding: 30,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#0a1a0a',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a3a1a',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 12,
    color: '#50C878',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 14,
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
});
