import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type Props = {
  width?: number;
  height?: number;
  floatAmplitude?: number; // pixels
  durationMs?: number; // one leg duration
};

// Make SVG <G> animatable (loosen typing to allow children + animatedProps)
const AnimatedG = Animated.createAnimatedComponent(G as any) as any;
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse as any) as any;
const AnimatedRect = Animated.createAnimatedComponent(Rect as any) as any;

export default function AnimatedLogo({ width = 130, height = 190, floatAmplitude = 6, durationMs = 1400 }: Props) {
  // Shared value for vertical offset
  const y = useSharedValue(0);
  // Shared value for shimmer x-position
  const sx = useSharedValue(-80);

  useEffect(() => {
    // Bobbing animation: up then down, repeat forever
    y.value = withRepeat(
      withSequence(
        withTiming(-floatAmplitude, { duration: durationMs, easing: Easing.inOut(Easing.quad) }),
        withTiming(floatAmplitude, { duration: durationMs, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // infinite
      true // reverse on each repeat to keep smooth
    );
    // Shimmer sweep left -> right -> jump back
    const viewW = 161; // from viewBox width
    const stripeW = 80;
    sx.value = withRepeat(
      withSequence(
        withTiming(viewW + stripeW, { duration: 1500, easing: Easing.linear }),
        withTiming(-stripeW, { duration: 0 })
      ),
      -1,
      false
    );
  }, [durationMs, floatAmplitude, y, sx]);

  // Animated transform for the gold group only
  const goldAnimatedProps = useAnimatedProps(() => {
    // react-native-svg accepts `transform` as a string
    // translate(dx, dy)
    return {
      transform: [{ translateY: y.value }],
    } as any;
  });

  // Animate shadow ellipse: widen and darken when icon is lower; shrink and lighten when higher
  const ellipseAnimatedProps = useAnimatedProps(() => {
    const amp = Math.max(1, floatAmplitude);
    // normalize y from [-amp, +amp] -> t in [0..1]
    const t = (y.value + amp) / (2 * amp);
    // base sizes from original: rx=30.1151, ry=5.18354, opacity ~0.65
    const rx = 26 + 8 * t; // 26..34
    const ry = 4.2 + 1.4 * t; // 4.2..5.6
    const opacity = 0.3 + 0.5 * t; // 0.3..0.8
    return { rx, ry, opacity } as any;
  });

  // Animated rect props for shimmer over text
  const shimmerRectProps = useAnimatedProps(() => {
    return { x: sx.value } as any;
  });

  return (
    <Svg width={width} height={height} viewBox="0 0 161 185" fill="none" >
      <Defs>
        <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="50%" stopColor="#FFFFFF" stopOpacity={0.6} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
        <ClipPath id="textClip">
          <Path d="M16.6332 155.545L20.5366 168.33H20.6814L24.5849 155.545H29.3064L23.4172 173H17.8008L11.9116 155.545H16.6332ZM43.1692 162.67V165.875H35.0896V162.67H43.1692ZM49.9516 173V155.545H54.1704V169.574H61.4318V173H49.9516ZM71.6745 155.545V173H67.4557V155.545H71.6745ZM82.126 155.545L86.0294 168.33H86.1743L90.0777 155.545H94.7993L88.9101 173H83.2936L77.4044 155.545H82.126ZM104.737 155.545V173H100.519V155.545H104.737ZM126.081 155.545V173H122.501L115.555 162.926H115.444V173H111.226V155.545H114.856L121.726 165.602H121.871V155.545H126.081ZM144.028 161.247C143.931 160.889 143.789 160.574 143.602 160.301C143.414 160.023 143.184 159.787 142.912 159.594C142.639 159.401 142.326 159.256 141.974 159.159C141.622 159.057 141.235 159.006 140.815 159.006C139.968 159.006 139.235 159.21 138.616 159.619C138.003 160.028 137.528 160.625 137.193 161.409C136.858 162.187 136.69 163.134 136.69 164.247C136.69 165.366 136.852 166.321 137.176 167.111C137.5 167.901 137.968 168.503 138.582 168.918C139.196 169.332 139.94 169.54 140.815 169.54C141.588 169.54 142.241 169.415 142.775 169.165C143.315 168.909 143.724 168.548 144.003 168.082C144.281 167.616 144.42 167.068 144.42 166.438L145.204 166.531H140.96V163.455H148.485V165.764C148.485 167.327 148.153 168.665 147.488 169.778C146.829 170.892 145.92 171.747 144.761 172.344C143.608 172.94 142.281 173.239 140.781 173.239C139.116 173.239 137.653 172.878 136.392 172.156C135.13 171.435 134.147 170.406 133.443 169.071C132.738 167.73 132.386 166.139 132.386 164.298C132.386 162.866 132.599 161.597 133.025 160.489C133.451 159.375 134.045 158.432 134.806 157.659C135.574 156.886 136.46 156.301 137.466 155.903C138.477 155.506 139.565 155.307 140.73 155.307C141.741 155.307 142.681 155.452 143.551 155.741C144.426 156.031 145.199 156.44 145.869 156.969C146.545 157.497 147.093 158.125 147.514 158.852C147.934 159.58 148.196 160.378 148.298 161.247H144.028Z" />
        </ClipPath>
      </Defs>
      {/* Gold shapes floating group */}
      <AnimatedG animatedProps={goldAnimatedProps}>
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M77.3287 0C51.6463 0 31 20.8546 31 46.3676C31 62.8708 40.5418 77.5694 49.2133 87.2791C53.7214 92.327 58.481 96.5787 62.6689 99.6594C64.75 101.19 66.8646 102.561 68.8786 103.608C70.33 104.362 73.5822 105.975 77.3287 105.975C81.075 105.975 84.3272 104.362 85.7786 103.608C87.7926 102.562 89.9073 101.191 91.9886 99.6598C96.1769 96.5791 100.937 92.3276 105.446 87.2797C114.118 77.5702 123.662 62.8714 123.662 46.3676C123.662 20.8527 103.009 0 77.3287 0ZM58.9364 31.5977C53.0499 36.7636 51.849 37.8175 51.849 50.6143C51.849 72.5696 57.0565 72.5696 77.331 72.5696C97.6055 72.5696 102.813 72.5696 102.813 50.6143C102.813 37.8159 101.614 36.7633 95.726 31.5957C94.7506 30.7396 93.6466 29.7706 92.398 28.6166C91.7971 28.1343 91.1429 27.5846 90.4471 26.9999C86.6517 23.8109 81.6191 19.5823 77.2566 19.5823C72.9541 19.5823 68.0853 23.7114 64.3573 26.873C63.61 27.5068 62.9086 28.1017 62.2667 28.6166C61.0172 29.7715 59.9124 30.7411 58.9364 31.5977Z"
          fill="#c9ab06ff"
        />
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M66 57.8797C66 56.2893 67.2964 55 68.8957 55H84.3534C85.9527 55 87.2491 56.2893 87.2491 57.8797C87.2491 59.4702 85.9527 60.7595 84.3534 60.7595H68.8957C67.2964 60.7595 66 59.4702 66 57.8797Z"
          fill="#c9ab06ff"
        />
      </AnimatedG>

      {/* Static overlays/shadows and text */}
      {/* <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M77.3287 0C51.6463 0 31 20.8546 31 46.3676C31 62.8708 40.5418 77.5694 49.2133 87.2791C53.7214 92.327 58.481 96.5787 62.6689 99.6594C64.75 101.19 66.8646 102.561 68.8786 103.608C70.33 104.362 73.5822 105.975 77.3287 105.975C81.075 105.975 84.3272 104.362 85.7786 103.608C87.7926 102.562 89.9073 101.191 91.9886 99.6598C96.1769 96.5791 100.937 92.3276 105.446 87.2797C114.118 77.5702 123.662 62.8714 123.662 46.3676C123.662 20.8527 103.009 0 77.3287 0ZM58.9364 31.5977C53.0499 36.7636 51.849 37.8175 51.849 50.6143C51.849 72.5696 57.0565 72.5696 77.331 72.5696C97.6055 72.5696 102.813 72.5696 102.813 50.6143C102.813 37.8159 101.614 36.7633 95.726 31.5957C94.7506 30.7396 93.6466 29.7706 92.398 28.6166C91.7971 28.1343 91.1429 27.5846 90.4471 26.9999C86.6517 23.8109 81.6191 19.5823 77.2566 19.5823C72.9541 19.5823 68.0853 23.7114 64.3573 26.873C63.61 27.5068 62.9086 28.1017 62.2667 28.6166C61.0172 29.7715 59.9124 30.7411 58.9364 31.5977Z"
        fill="black"
        fillOpacity={0.16}
      /> */}
  <AnimatedEllipse animatedProps={ellipseAnimatedProps} cx={77.3309} cy={115.766} fill="#101828" />
      {/* <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M66 57.8797C66 56.2893 67.2964 55 68.8957 55H84.3534C85.9527 55 87.2491 56.2893 87.2491 57.8797C87.2491 59.4702 85.9527 60.7595 84.3534 60.7595H68.8957C67.2964 60.7595 66 59.4702 66 57.8797Z"
        fill="black"
        fillOpacity={0.16}
      /> */}
      <Path d="M16.6332 155.545L20.5366 168.33H20.6814L24.5849 155.545H29.3064L23.4172 173H17.8008L11.9116 155.545H16.6332ZM43.1692 162.67V165.875H35.0896V162.67H43.1692ZM49.9516 173V155.545H54.1704V169.574H61.4318V173H49.9516ZM71.6745 155.545V173H67.4557V155.545H71.6745ZM82.126 155.545L86.0294 168.33H86.1743L90.0777 155.545H94.7993L88.9101 173H83.2936L77.4044 155.545H82.126ZM104.737 155.545V173H100.519V155.545H104.737ZM126.081 155.545V173H122.501L115.555 162.926H115.444V173H111.226V155.545H114.856L121.726 165.602H121.871V155.545H126.081ZM144.028 161.247C143.931 160.889 143.789 160.574 143.602 160.301C143.414 160.023 143.184 159.787 142.912 159.594C142.639 159.401 142.326 159.256 141.974 159.159C141.622 159.057 141.235 159.006 140.815 159.006C139.968 159.006 139.235 159.21 138.616 159.619C138.003 160.028 137.528 160.625 137.193 161.409C136.858 162.187 136.69 163.134 136.69 164.247C136.69 165.366 136.852 166.321 137.176 167.111C137.5 167.901 137.968 168.503 138.582 168.918C139.196 169.332 139.94 169.54 140.815 169.54C141.588 169.54 142.241 169.415 142.775 169.165C143.315 168.909 143.724 168.548 144.003 168.082C144.281 167.616 144.42 167.068 144.42 166.438L145.204 166.531H140.96V163.455H148.485V165.764C148.485 167.327 148.153 168.665 147.488 169.778C146.829 170.892 145.92 171.747 144.761 172.344C143.608 172.94 142.281 173.239 140.781 173.239C139.116 173.239 137.653 172.878 136.392 172.156C135.13 171.435 134.147 170.406 133.443 169.071C132.738 167.73 132.386 166.139 132.386 164.298C132.386 162.866 132.599 161.597 133.025 160.489C133.451 159.375 134.045 158.432 134.806 157.659C135.574 156.886 136.46 156.301 137.466 155.903C138.477 155.506 139.565 155.307 140.73 155.307C141.741 155.307 142.681 155.452 143.551 155.741C144.426 156.031 145.199 156.44 145.869 156.969C146.545 157.497 147.093 158.125 147.514 158.852C147.934 159.58 148.196 160.378 148.298 161.247H144.028Z" fill="#1F2A37" />
      {/* Shimmer overlay inside text shapes */}
      <G clipPath="url(#textClip)">
        <AnimatedRect
          animatedProps={shimmerRectProps}
          y={150}
          width={80}
          height={40}
          fill="url(#shimmer)"
        />
      </G>
    </Svg>
  );
}
