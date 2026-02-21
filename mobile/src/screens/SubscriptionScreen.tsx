import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { subscriptionApi } from '../services/api';
import { colors, spacing, fontSize, borderRadius } from '../utils/theme';

const BILLING_OPTIONS = [
  { id: '1_month', label: '1 Month', price: 20, perMonth: 20, savings: 0 },
  { id: '3_months', label: '3 Months', price: 57, perMonth: 19, savings: 5 },
  { id: '6_months', label: '6 Months', price: 108, perMonth: 18, savings: 10 },
  { id: '9_months', label: '9 Months', price: 153, perMonth: 17, savings: 15 },
  { id: '12_months', label: '12 Months', price: 192, perMonth: 16, savings: 20 },
];

const PRO_FEATURES = [
  'Unlimited messages per day',
  'Priority AI processing',
  'Advanced regime analysis',
  'Export conversations',
  'Email support',
];

export default function SubscriptionScreen() {
  const [selectedOption, setSelectedOption] = useState('1_month');
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const response = await subscriptionApi.getStatus();
      if (response.result?.data?.json) {
        setSubscriptionStatus(response.result.data.json);
      }
    } catch (error) {
      console.error('Failed to load subscription status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await subscriptionApi.createCheckout(selectedOption);
      if (response.result?.data?.json?.url) {
        await Linking.openURL(response.result.data.json.url);
      } else {
        Alert.alert('Error', 'Failed to create checkout session');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (subscriptionStatus?.isPro) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.activeContainer}>
          <View style={styles.proBadgeLarge}>
            <Text style={styles.proBadgeLargeText}>PRO</Text>
          </View>
          <Text style={styles.activeTitle}>You're a Pro Member!</Text>
          <Text style={styles.activeSubtitle}>
            Thank you for supporting REOP-AI. You have access to all premium features.
          </Text>

          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Your Benefits</Text>
            {PRO_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => Linking.openURL('https://reop-ai.com/settings')}
          >
            <Text style={styles.manageButtonText}>Manage on Website</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Pro</Text>
        <Text style={styles.subtitle}>
          Unlock unlimited AI conversations and premium features
        </Text>
      </View>

      {/* Features */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>Pro Features</Text>
        {PRO_FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      {/* Billing Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Choose Your Plan</Text>
        {BILLING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              selectedOption === option.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedOption(option.id)}
          >
            <View style={styles.optionHeader}>
              <View style={styles.radioOuter}>
                {selectedOption === option.id && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionLabel}>{option.label}</Text>
              {option.savings > 0 && (
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsBadgeText}>Save {option.savings}%</Text>
                </View>
              )}
            </View>
            <View style={styles.optionPricing}>
              <Text style={styles.optionPrice}>${option.price}</Text>
              <Text style={styles.optionPerMonth}>${option.perMonth}/mo</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={handleSubscribe}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} />
        ) : (
          <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Payment will be processed securely via Stripe. You can cancel anytime.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  featuresCard: {
    margin: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuresTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkmark: {
    fontSize: fontSize.md,
    color: colors.success,
    marginRight: spacing.sm,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  optionsContainer: {
    padding: spacing.md,
  },
  optionsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  optionCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primary,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  savingsBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  savingsBadgeText: {
    fontSize: fontSize.xs,
    color: colors.background,
    fontWeight: 'bold',
  },
  optionPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingLeft: 28,
  },
  optionPrice: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary,
  },
  optionPerMonth: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  subscribeButton: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: colors.background,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  activeContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  proBadgeLarge: {
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  proBadgeLargeText: {
    color: colors.background,
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  activeTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  activeSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  manageButton: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
  },
  manageButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
