import ThemedText from "@components/design/Typography/ThemedText";
import { Variables } from "@style/theme";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

type Props = {
  onPress: () => void;
  children: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

const styles = StyleSheet.create({
  
  base: {
    width: "90%",
    alignSelf: "center",
    paddingVertical: Variables.sizes.md,
    borderRadius: Variables.sizes.xl, 
    
   
    marginVertical: Variables.sizes.sm, 

    alignItems: 'center',
    justifyContent: 'center',

    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

 
  primary: {
    backgroundColor: Variables.colors.primary,
  },

  
  secondary: {
    backgroundColor: Variables.colors.surface, 
    borderWidth: 1.5,
    borderColor: Variables.colors.primary, 
    elevation: 2, 
  }
});

const Button = ({ 
  onPress, 
  children, 
  style, 
  disabled = false, 
  variant = "primary"
}: Props) => {
  
  
  const isPrimary = variant === "primary";

  return (
    <Pressable
      disabled={disabled}
      accessibilityLabel={children}
      onPress={onPress}
      
      style={[
        styles.base, 
        isPrimary ? styles.primary : styles.secondary, 
        style
      ]}
    >
      <View>
        <ThemedText 
          type="button" 
          color={isPrimary ? "inverse" : "blue"}
        >
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
};

export default Button;