import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
  resetKey: number;
};

/**
 * Root-level error boundary that catches unexpected React crashes
 * and shows a recovery screen instead of a blank white page.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _info: React.ErrorInfo) {
    // In production, send to crash reporting service (e.g., Sentry)
    // Sentry.captureException(error, { extra: info });
  }

  handleReset = () => {
    this.setState((prev) => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#0D0C00',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(224, 122, 95, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Ionicons name="warning-outline" size={36} color="#E07A5F" />
          </View>

          <Text
            style={{
              color: 'rgba(250,243,235,0.90)',
              fontSize: 20,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>

          <Text
            style={{
              color: 'rgba(250,243,235,0.62)',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 20,
            }}
          >
            An unexpected error occurred. Please try again.
          </Text>

          <Pressable
            onPress={this.handleReset}
            style={{
              backgroundColor: '#D9B991',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                color: '#1A0F08',
                fontWeight: 'bold',
                fontSize: 15,
              }}
            >
              Try Again
            </Text>
          </Pressable>

          {__DEV__ && this.state.error && (
            <Text
              style={{
                color: 'rgba(250,243,235,0.38)',
                fontSize: 11,
                textAlign: 'center',
                marginTop: 24,
                maxWidth: 300,
              }}
            >
              {this.state.error.message}
            </Text>
          )}
        </View>
      );
    }

    // Use resetKey to force children to remount after an error recovery
    return <View key={this.state.resetKey} style={{ flex: 1 }}>{this.props.children}</View>;
  }
}
