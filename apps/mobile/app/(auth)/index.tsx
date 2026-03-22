import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function AuthIndex() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16 }}>
      <Text style={{ color: 'white', fontSize: 32, fontWeight: '700' }}>NaRotta</Text>
      <Text style={{ color: '#94a3b8', textAlign: 'center' }}>Base mobile com rotas para passageiro e motorista.</Text>
      <Link href="/passenger" style={{ color: '#38bdf8' }}>Entrar como passageiro</Link>
      <Link href="/driver" style={{ color: '#38bdf8' }}>Entrar como motorista</Link>
    </View>
  );
}
