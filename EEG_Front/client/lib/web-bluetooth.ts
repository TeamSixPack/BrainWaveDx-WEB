// Web Bluetooth API를 통한 Muse 2 헤드밴드 연결
export interface Muse2Data {
  timestamp: number;
  eeg1: number;
  eeg2: number;
  eeg3: number;
  eeg4: number;
}

export class Muse2Bluetooth {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected = false;
  private dataCallback: ((data: Muse2Data) => void) | null = null;

  // Muse 2 서비스 및 특성 UUID
  private readonly MUSE_SERVICE_UUID = '0000fe8d-0000-1000-8000-00805f9b34fb';
  private readonly MUSE_CHARACTERISTIC_UUID = '273e0001-4c4d-454d-96be-f4035401e9a9';

  async connect(): Promise<boolean> {
    try {
      console.log('[MUSE2] Web Bluetooth 연결 시작...');

      // 블루투스 지원 확인
      if (!navigator.bluetooth) {
        throw new Error('이 브라우저는 Web Bluetooth를 지원하지 않습니다.');
      }

      // Muse 2 헤드밴드 검색 및 연결
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Muse' },
          { namePrefix: 'Muse-2' }
        ],
        optionalServices: [this.MUSE_SERVICE_UUID]
      });

      console.log('[MUSE2] 장치 발견:', this.device.name);

      // GATT 서버 연결
      this.server = await this.device.gatt!.connect();
      console.log('[MUSE2] GATT 서버 연결 완료');

      // 서비스 가져오기
      this.service = await this.server.getPrimaryService(this.MUSE_SERVICE_UUID);
      console.log('[MUSE2] 서비스 연결 완료');

      // 특성 가져오기
      this.characteristic = await this.service.getCharacteristic(this.MUSE_CHARACTERISTIC_UUID);
      console.log('[MUSE2] 특성 연결 완료');

      // 알림 활성화
      await this.characteristic.startNotifications();
      console.log('[MUSE2] 알림 활성화 완료');

      // 데이터 수신 리스너 등록
      this.characteristic.addEventListener('characteristicvaluechanged', this.handleData.bind(this));

      this.isConnected = true;
      console.log('[MUSE2] 연결 완료!');
      return true;

    } catch (error) {
      console.error('[MUSE2] 연결 실패:', error);
      this.isConnected = false;
      return false;
    }
  }

  private handleData(event: Event) {
    if (!this.dataCallback) return;

    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const value = characteristic.value;
    
    if (!value) return;

    // Muse 2 데이터 파싱 (실제 구현 필요)
    const data: Muse2Data = {
      timestamp: Date.now(),
      eeg1: this.parseEEGData(value, 0),
      eeg2: this.parseEEGData(value, 1),
      eeg3: this.parseEEGData(value, 2),
      eeg4: this.parseEEGData(value, 3)
    };

    this.dataCallback(data);
  }

  private parseEEGData(value: DataView, channel: number): number {
    // Muse 2 데이터 파싱 로직 (실제 구현 필요)
    // 여기서는 임시로 랜덤 데이터 반환
    return Math.random() * 100 - 50;
  }

  onData(callback: (data: Muse2Data) => void) {
    this.dataCallback = callback;
  }

  async disconnect(): Promise<void> {
    try {
      if (this.characteristic) {
        await this.characteristic.stopNotifications();
      }
      if (this.server) {
        this.server.disconnect();
      }
      this.isConnected = false;
      console.log('[MUSE2] 연결 해제 완료');
    } catch (error) {
      console.error('[MUSE2] 연결 해제 실패:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getDeviceName(): string | null {
    return this.device?.name || null;
  }
}

// 전역 인스턴스
export const muse2Bluetooth = new Muse2Bluetooth();
