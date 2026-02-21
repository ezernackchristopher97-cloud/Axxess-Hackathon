import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Alert,
  Linking,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

interface VoiceCheckInProps {
  onResponse: (response: 'okay' | 'help' | 'emergency' | 'unclear') => void;
  onCancel: () => void;
  prompt?: string;
}

// Phrases that indicate the user is okay
const OKAY_PHRASES = [
  "i'm okay", "im okay", "i am okay",
  "i'm fine", "im fine", "i am fine",
  "i'm good", "im good", "i am good",
  "i'm alright", "im alright", "i am alright",
  "yes", "yeah", "okay", "fine", "good",
  "doing well", "doing okay", "doing fine",
  "all good", "all okay", "safe"
];

// Phrases that indicate the user needs help
const HELP_PHRASES = [
  "help", "help me", "i need help",
  "not okay", "not ok", "not good", "not fine",
  "struggling", "bad", "scared", "afraid",
  "need support", "need someone", "please help",
  "having a hard time", "difficult", "tough"
];

// Phrases that indicate an emergency
const EMERGENCY_PHRASES = [
  "call 911", "emergency", "danger",
  "he's here", "she's here", "they're here",
  "help me now", "attacking", "hurt",
  "call police", "need ambulance", "in danger"
];

export default function VoiceCheckIn({ onResponse, onCancel, prompt }: VoiceCheckInProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'result'>('idle');
  const [result, setResult] = useState<'okay' | 'help' | 'emergency' | 'unclear' | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Pulse animation
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

      // Wave animation
      Animated.loop(
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      waveAnim.setValue(0);
    }
  }, [isListening]);

  const startListening = async () => {
    try {
      const { status: audioStatus } = await Audio.requestPermissionsAsync();
      if (audioStatus !== 'granted') {
        Alert.alert(
          'Microphone Permission',
          'Voice check-in requires microphone access. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsListening(true);
      setStatus('listening');
      setTranscript('');
      
      Vibration.vibrate(50);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (newRecording) {
          stopListening();
        }
      }, 10000);
    } catch (e) {
      console.error('Failed to start recording:', e);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
    }
  };

  const stopListening = async () => {
    if (!recording) return;

    try {
      setIsListening(false);
      setStatus('processing');
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // In a real app, this would send the audio to a speech-to-text service
      // For demo, we'll simulate with a random response
      await processAudio(uri);
    } catch (e) {
      console.error('Failed to stop recording:', e);
      setStatus('idle');
    }
  };

  const processAudio = async (uri: string | null) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, this would use a speech-to-text API
    // For demo, we'll simulate with example responses
    const simulatedResponses = [
      "I'm okay, just checking in",
      "I'm fine, thanks for asking",
      "Doing good today",
      "I need some help",
      "Not feeling great",
    ];
    
    const randomResponse = simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];
    setTranscript(randomResponse);
    
    // Analyze the response
    const response = analyzeResponse(randomResponse);
    setResult(response);
    setStatus('result');
    
    // Haptic feedback based on result
    if (response === 'emergency') {
      Vibration.vibrate([0, 200, 100, 200, 100, 200]);
    } else if (response === 'help') {
      Vibration.vibrate([0, 100, 100, 100]);
    } else {
      Vibration.vibrate(50);
    }
  };

  const analyzeResponse = (text: string): 'okay' | 'help' | 'emergency' | 'unclear' => {
    const lowerText = text.toLowerCase();

    // Check for emergency first (highest priority)
    if (EMERGENCY_PHRASES.some(phrase => lowerText.includes(phrase))) {
      return 'emergency';
    }

    // Check for help phrases
    if (HELP_PHRASES.some(phrase => lowerText.includes(phrase))) {
      return 'help';
    }

    // Check for okay phrases
    if (OKAY_PHRASES.some(phrase => lowerText.includes(phrase))) {
      return 'okay';
    }

    return 'unclear';
  };

  const handleConfirm = () => {
    if (result) {
      onResponse(result);
    }
  };

  const handleRetry = () => {
    setStatus('idle');
    setResult(null);
    setTranscript('');
  };

  const getResultColor = () => {
    switch (result) {
      case 'okay': return '#10b981';
      case 'help': return '#f59e0b';
      case 'emergency': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getResultIcon = () => {
    switch (result) {
      case 'okay': return 'checkmark-circle';
      case 'help': return 'hand-left';
      case 'emergency': return 'warning';
      default: return 'help-circle';
    }
  };

  const getResultMessage = () => {
    switch (result) {
      case 'okay': return "Great! You're doing okay.";
      case 'help': return "I hear you need support.";
      case 'emergency': return "Emergency detected. Help is available.";
      default: return "I didn't quite catch that.";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#9ca3af" />
        </TouchableOpacity>
        <Text style={styles.title}>Voice Check-In</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Prompt */}
      <Text style={styles.prompt}>
        {prompt || "How are you feeling right now?"}
      </Text>

      {/* Main Content */}
      <View style={styles.content}>
        {status === 'idle' && (
          <>
            <TouchableOpacity
              style={styles.micButton}
              onPress={startListening}
              activeOpacity={0.8}
            >
              <Ionicons name="mic" size={48} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.instruction}>
              Tap to speak your response
            </Text>
            <Text style={styles.examples}>
              Say "I'm okay" or "I need help"
            </Text>
          </>
        )}

        {status === 'listening' && (
          <>
            <Animated.View
              style={[
                styles.listeningCircle,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="mic" size={48} color="#ffffff" />
            </Animated.View>
            <Text style={styles.listeningText}>Listening...</Text>
            <TouchableOpacity
              style={styles.stopButton}
              onPress={stopListening}
            >
              <Ionicons name="stop" size={24} color="#ffffff" />
              <Text style={styles.stopButtonText}>Tap to stop</Text>
            </TouchableOpacity>
          </>
        )}

        {status === 'processing' && (
          <>
            <View style={styles.processingContainer}>
              <Ionicons name="sync" size={48} color="#3b82f6" />
            </View>
            <Text style={styles.processingText}>Processing your response...</Text>
          </>
        )}

        {status === 'result' && (
          <>
            <View style={[styles.resultCircle, { backgroundColor: `${getResultColor()}30` }]}>
              <Ionicons name={getResultIcon()} size={48} color={getResultColor()} />
            </View>
            
            <Text style={[styles.resultMessage, { color: getResultColor() }]}>
              {getResultMessage()}
            </Text>
            
            {transcript && (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>You said:</Text>
                <Text style={styles.transcriptText}>"{transcript}"</Text>
              </View>
            )}

            <View style={styles.resultButtons}>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
              >
                <Ionicons name="refresh" size={20} color="#9ca3af" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: getResultColor() }]}
                onPress={handleConfirm}
              >
                <Ionicons name="checkmark" size={20} color="#ffffff" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>

            {result === 'emergency' && (
              <TouchableOpacity
                style={styles.emergencyButton}
                onPress={() => Linking.openURL('tel:911')}
              >
                <Ionicons name="call" size={20} color="#ffffff" />
                <Text style={styles.emergencyButtonText}>Call 911</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Quick Response Buttons */}
      {(status === 'idle' || status === 'listening') && (
        <View style={styles.quickResponses}>
          <Text style={styles.quickResponsesLabel}>Or tap to respond:</Text>
          <View style={styles.quickResponseButtons}>
            <TouchableOpacity
              style={[styles.quickButton, styles.quickButtonOkay]}
              onPress={() => {
                setResult('okay');
                setStatus('result');
                setTranscript('');
              }}
            >
              <Text style={styles.quickButtonText}>I'm Okay</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickButton, styles.quickButtonHelp]}
              onPress={() => {
                setResult('help');
                setStatus('result');
                setTranscript('');
              }}
            >
              <Text style={styles.quickButtonText}>Need Help</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  prompt: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  instruction: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  examples: {
    fontSize: 14,
    color: '#71717a',
  },
  listeningCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  listeningText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 24,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  processingContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3b82f620',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  processingText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  resultCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  transcriptBox: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#71717a',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#ffffff',
    fontStyle: 'italic',
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  quickResponses: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  quickResponsesLabel: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 12,
  },
  quickResponseButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickButtonOkay: {
    backgroundColor: '#10b98130',
    borderWidth: 1,
    borderColor: '#10b98150',
  },
  quickButtonHelp: {
    backgroundColor: '#f59e0b30',
    borderWidth: 1,
    borderColor: '#f59e0b50',
  },
  quickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
