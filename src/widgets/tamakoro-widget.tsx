import { HStack, Image, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { accessibilityLabel, aspectRatio, containerBackground, font, foregroundStyle, frame, lineLimit,
  padding, progressViewStyle, resizable, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetProps } from './timeline';

const TamakoroLayout = (props: WidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const data = props?.name ? props : { name: 'Tamakoro', stage: '', age: '', status: 'Ouvrir / Open',
    evolution: '', image: '', empty: true, dead: false, alert: false, gauges: [] };
  const medium = environment.widgetFamily === 'systemMedium';
  const monochrome = environment.widgetRenderingMode === 'accented' || environment.widgetRenderingMode === 'vibrant';
  const accent = monochrome ? '#FFFFFF' : '#d4fbb5';
  const ink = monochrome ? '#FFFFFF' : '#eaf6f0';
  const muted = monochrome ? '#FFFFFF' : '#a3bcc0';
  const root = [widgetURL('tamakoro:///'), containerBackground('#101c26', 'widget'), padding({ all: 12 })];
  const creature = data.image
    ? <Image uiImage={data.image} modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }),
      frame({ width: medium ? 76 : 62, height: medium ? 76 : 62 }), accessibilityLabel(data.stage)]} />
    : <Image systemName="sparkles" color={accent} size={44} />;
  const statusColor = monochrome ? ink : data.alert ? '#ffac77' : data.dead ? '#a3bcc0' : '#d4fbb5';
  if (!medium) return <VStack spacing={3} modifiers={root}>
    <Text modifiers={[font({ size: 14, weight: 'bold', design: 'monospaced' }), foregroundStyle(accent), lineLimit(1)]}>{data.name}</Text>
    {data.stage ? <Text modifiers={[font({ size: 9 }), foregroundStyle(muted), lineLimit(1)]}>{data.stage}</Text> : null}
    {creature}
    <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(statusColor), lineLimit(2)]}>{data.status}</Text>
    {data.age ? <Text modifiers={[font({ size: 10, design: 'monospaced' }), foregroundStyle(ink), lineLimit(1)]}>{data.age}</Text> : null}
  </VStack>;
  return <HStack spacing={14} modifiers={root}>
    <VStack spacing={3} modifiers={[frame({ width: 110 })]}>
      <Text modifiers={[font({ size: 14, weight: 'bold', design: 'monospaced' }), foregroundStyle(accent), lineLimit(1)]}>{data.name}</Text>
      {creature}
      <Text modifiers={[font({ size: 9, design: 'monospaced' }), foregroundStyle(ink), lineLimit(1)]}>{data.age || 'Tamakoro'}</Text>
      <Text modifiers={[font({ size: 9 }), foregroundStyle(muted), lineLimit(1)]}>{data.stage}</Text>
    </VStack>
    <VStack alignment="leading" spacing={4} modifiers={[frame({ maxWidth: Infinity })]}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(statusColor), lineLimit(1)]}>{data.status}</Text>
      {data.gauges.map((gauge, index) => <HStack key={index} spacing={5}>
        <Text modifiers={[font({ size: 9 }), foregroundStyle(muted), frame({ width: 53, alignment: 'leading' }), lineLimit(1)]}>{gauge.label}</Text>
        <ProgressView value={gauge.value / 100} modifiers={[progressViewStyle('linear'),
          tint(monochrome ? ink : gauge.severity === 'critical' ? '#ff8078' : gauge.color), frame({ maxWidth: Infinity }),
          accessibilityLabel(`${gauge.label} ${gauge.value}/100`)]} />
        <Text modifiers={[font({ size: 9, design: 'monospaced' }), foregroundStyle(ink), frame({ width: 24, alignment: 'trailing' })]}>{gauge.value}</Text>
      </HStack>)}
      {data.empty ? <Spacer /> : null}
      <Text modifiers={[font({ size: 9 }), foregroundStyle(muted), lineLimit(2)]}>{data.evolution}</Text>
    </VStack>
  </HStack>;
};
export default createWidget('TamakoroWidget', TamakoroLayout);
