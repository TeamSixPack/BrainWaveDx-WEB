// Spring 백엔드 API 기본 URL
const API_BASE_URL = 'http://localhost:8090';

// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  user?: T;
}

export interface PasswordResponse {
  tempPassword: string;
  user: User;
}

export interface User {
  uid: string;
  id?: string; // 백엔드 호환성을 위해 id도 지원
  name: string;
  phone: string;
}

export interface ChangePasswordRequest {
  uid: string;
  currentPw: string;
  newPw: string;
}

export interface LoginRequest {
  uid: string;
  pw: string;
}

export interface SignupRequest {
  uid: string;
  pw: string;
  name: string;
  phone: string;
}

// 아이디 중복 확인
export const checkIdDuplicate = async (uid: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('uid', uid);
    
    const response = await fetch(`${API_BASE_URL}/checkId`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error('아이디 중복 확인 요청에 실패했습니다.');
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '아이디 중복 확인에 실패했습니다.');
    }
    
    return result.isDuplicate;
  } catch (error) {
    console.error('아이디 중복 확인 실패:', error);
    throw error;
  }
};

// 회원가입
export const signup = async (data: SignupRequest): Promise<ApiResponse<User>> => {
  try {
    const formData = new FormData();
    formData.append('uid', data.uid);
    formData.append('pw', data.pw);
    formData.append('name', data.name);
    formData.append('phone', data.phone);
    
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
      method: 'POST',
      body: formData,
    });
    
    const result: ApiResponse<User> = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '회원가입에 실패했습니다.');
    }
    
    return result;
  } catch (error) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};

// 로그인
export const login = async (data: LoginRequest): Promise<ApiResponse<User>> => {
  try {
    const formData = new FormData();
    formData.append('uid', data.uid);
    formData.append('pw', data.pw);
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      body: formData,
    });
    
    const result: ApiResponse<User> = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || '로그인에 실패했습니다.');
    }
    
    return result;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

// 비밀번호 찾기
export const findPassword = async (phoneOrUid: string, usePhone: boolean = true): Promise<ApiResponse<PasswordResponse>> => {
  try {
    const formData = new FormData();
    if (usePhone) {
      formData.append('phone', phoneOrUid);
    } else {
      formData.append('uid', phoneOrUid);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/findPassword`, {
      method: 'POST',
      body: formData,
    });
    
    const raw: any = await response.json();
    const result: ApiResponse<PasswordResponse> = raw;
    // 백엔드가 data 래핑 없이 tempPassword/user를 루트에 담아 보내는 경우를 보정
    if (!result.data && (raw.tempPassword || raw.user)) {
      (result as any).data = {
        tempPassword: raw.tempPassword,
        user: raw.user,
      } as PasswordResponse;
    }
    
    if (!response.ok) {
      throw new Error(result.message || '비밀번호 찾기에 실패했습니다.');
    }
    
    return result;
  } catch (error) {
    console.error('비밀번호 찾기 실패:', error);
    throw error;
  }
};

// ----- Session / Cognitive APIs -----

export const startSession = async (userId: string): Promise<{ success: boolean; sessionIdx?: number; message?: string }> => {
  const formData = new FormData();
  formData.append('userId', userId);
  const res = await fetch(`${API_BASE_URL}/api/session/start`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || '세션 시작 실패');
  return { success: true, sessionIdx: data.sessionIdx };
};

export const endSession = async (sessionIdx: number): Promise<boolean> => {
  const formData = new FormData();
  formData.append('sessionIdx', String(sessionIdx));
  const res = await fetch(`${API_BASE_URL}/api/session/end`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || '세션 종료 실패');
  return true;
};

export const saveCognitiveScore = async (sessionIdx: number, cogType: 'MMSE' | 'MOCA', score: number): Promise<boolean> => {
  const form = new FormData();
  form.append('sessionIdx', String(sessionIdx));
  form.append('cogType', cogType);
  form.append('score', String(score));
  const res = await fetch(`${API_BASE_URL}/api/cognitive/score`, { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.message || '검사 점수 저장 실패');
  return true;
};



// 비밀번호 변경
export const changePassword = async (data: ChangePasswordRequest): Promise<ApiResponse<null>> => {
  try {
    const formData = new FormData();
    formData.append('uid', data.uid);
    formData.append('currentPw', data.currentPw);
    formData.append('newPw', data.newPw);

    const response = await fetch(`${API_BASE_URL}/api/changePassword`, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<null> = await response.json();
    if (!response.ok) {
      throw new Error(result.message || '비밀번호 변경에 실패했습니다.');
    }
    return result;
  } catch (error) {
    console.error('비밀번호 변경 실패:', error);
    throw error;
  }
};

// CORS 테스트 함수
export const testCors = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`, {
      method: 'GET',
      mode: 'cors',
    });
    
    if (response.ok) {
      const result = await response.text();
      console.log('CORS 테스트 성공:', result);
      return true;
    } else {
      console.error('CORS 테스트 실패:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('CORS 테스트 에러:', error);
    return false;
  }
};

// POST 요청 CORS 테스트
export const testPostCors = async (message: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    
    const response = await fetch(`${API_BASE_URL}/test-post`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('POST CORS 테스트 성공:', result);
      return true;
    } else {
      console.error('POST CORS 테스트 실패:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('POST CORS 테스트 에러:', error);
    return false;
  }
};
