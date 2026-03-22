import { Button, SafeAreaView, Text, View } from 'react-native';

export default function DriverHome() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#030712', padding: 16 }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 16 }}>NaRotta Motorista</Text>
      <View style={{ backgroundColor: '#111827', padding: 16, borderRadius: 16, marginBottom: 12 }}>
        <Text style={{ color: '#fff' }}>Status: Online</Text>
        <Text style={{ color: '#94a3b8', marginTop: 8 }}>Agora com matching priorizando nota, distancia, aceitacao e cancelamento.</Text>
      </View>
      <Button title="Ficar offline" onPress={() => {}} />
    </SafeAreaView>
  );
}
