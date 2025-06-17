import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { captureRef } from 'react-native-view-shot';

/**
 * Props:
 * - imageUri: base image
 * - stickers: array of stickers (with type, value, left, top)
 * - width, height: dimensions of the image/sticker canvas
 * - onCapture: callback with uri after capture
 */
const StickerShot = forwardRef(({ imageUri, stickers = [], width, height, children }, ref) => {
  const viewRef = useRef();

  useImperativeHandle(ref, () => ({
    async capture() {
      return await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });
    },
  }));

  return (
    <View ref={viewRef} collapsable={false} style={[styles.root, { width, height }]}> 
      <Image source={{ uri: imageUri }} style={{ width, height, position: 'absolute' }} resizeMode="contain" />
      {stickers.map(stk => {
        const style = [
          stk.type === 'emoji' ? styles.emoji : styles.textSticker,
          { position: 'absolute', left: `${stk.left}%`, top: `${stk.top}%` },
        ];
        return stk.type === 'emoji' ? (
          <View key={stk.id} style={style} pointerEvents="none">
            <View><Text style={styles.emoji}>{stk.value}</Text></View>
          </View>
        ) : (
          <View key={stk.id} style={style} pointerEvents="none">
            <View style={styles.textSticker}><Text style={styles.textStickerLabel}>{stk.value}</Text></View>
          </View>
        );
      })}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40 },
  textSticker: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  textStickerLabel: { color: '#FFF', fontSize: 20, fontWeight: '600' },
});

export default StickerShot;
