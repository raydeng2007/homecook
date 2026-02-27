import { View, Text, TextInput, TextInputProps } from 'react-native';

interface FormInputProps extends Omit<TextInputProps, 'className'> {
  label: string;
  error?: string | null;
}

export function FormInput({
  label,
  error,
  secureTextEntry,
  ...props
}: FormInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm text-text-medium mb-2">{label}</Text>
      <TextInput
        className={`bg-surface-1 border px-4 py-3 rounded-xl text-base text-text-high ${
          error ? 'border-error' : 'border-surface-4'
        }`}
        placeholderTextColor="rgba(255, 255, 255, 0.38)"
        secureTextEntry={secureTextEntry}
        autoCapitalize={secureTextEntry ? 'none' : props.autoCapitalize}
        autoCorrect={secureTextEntry ? false : props.autoCorrect}
        {...props}
      />
      {error && (
        <Text className="text-sm text-error mt-1">{error}</Text>
      )}
    </View>
  );
}
