import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity,Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatbotSheet } from './ChatbotSheet';


const GOLD = '#E0B100';

export function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
        {/* //get image  */}
      <Image source={require("../../assets/images/chatboticon/bott.svg")}
  style={{ width: 40, height: 40 }}
/>

      </TouchableOpacity>
      <ChatbotSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
