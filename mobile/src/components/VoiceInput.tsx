import React, { useState, useRef } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  Animated,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { voiceApi } from '../services/api';
import { colors } from '../utils/theme';

interface VoiceInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  size?: number;
}

export function VoiceInput({ onTranscription, disabled, size = 44 }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone access to use voice input.');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      startPulseAnimation();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      stopPulseAnimation();
      setIsProcessing(true);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Read the audio file and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          // Send to transcription API
          const result = await voiceApi.transcribe(base64);
          
          if (result?.result?.data?.text) {
            onTranscription(result.result.data.text);
          } else {
            Alert.alert('No Speech Detected', 'Please try speaking again.');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          Alert.alert('Error', 'Failed to transcribe audio. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    }
  };

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (isProcessing) {
    return (
      <View style={[styles.button, { width: size, height: size }]}>
        <ActivityIndicator size="small" color={colors.gold} />
      </View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          { width: size, height: size },
          isRecording && styles.recording,
          disabled && styles.disabled,
        ]}
        onPress={handlePress}
        disabled={disabled || isProcessing}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={size * 0.5}
          color={isRecording ? colors.error : colors.gold}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 22,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
});
