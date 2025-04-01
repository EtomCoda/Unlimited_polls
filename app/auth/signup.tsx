import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { set } from "date-fns";



export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter a valid email and password');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            Alert.alert('Success', 'Check your email for the confirmation link');
            router.push('/auth/signin');
        } catch (error:any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sign Up</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
               
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                keyboardType="default"
                secureTextEntry={true}
            />
            <Pressable style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? (
                    <Text style={styles.buttonText}>Loading...</Text>
                ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                )}
            </Pressable>
            <Text style={styles.or}>OR</Text>
            <Pressable onPress={() => router.push('/auth/signin')} style={styles.link}>
                <Text style={styles.linkText}>Already have an account? Sign In</Text>
            </Pressable>
        </View>
        
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title:{
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#0891b2',
        paddingVertical: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    or: {
        textAlign: 'center',
        marginVertical: 10,
    },
    link: {
        alignItems: 'center',
    },
    linkText: {
        color: '#0891b2',
    },
});