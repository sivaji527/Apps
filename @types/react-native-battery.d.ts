declare module 'react-native-battery' {
    export function useBatteryLevel(): number | null;
    export function useBatteryLevelIsLow(): boolean;
}