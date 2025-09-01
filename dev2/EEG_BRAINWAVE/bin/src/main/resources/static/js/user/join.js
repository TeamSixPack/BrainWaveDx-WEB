document.addEventListener('DOMContentLoaded', function() {
		

	// 취소 버튼 클릭 이벤트
	document.querySelector('.reback-btn')?.addEventListener('click', function (e) {
	    e.preventDefault();
	    window.location.href = '/mainPage';
	});
	

	// 비밀번호 보기/숨기기 기능
	$('.password-toggle-icon').click(function() {
	    const passwordInput = $(this).siblings('input');
	    const icon = $(this).find('i');
	    
	    if (passwordInput.attr('type') === 'password') {
	        passwordInput.attr('type', 'text');
	        icon.removeClass('fa-eye').addClass('fa-eye-slash');
	    } else {
	        passwordInput.attr('type', 'password');
	        icon.removeClass('fa-eye-slash').addClass('fa-eye');
	    }
	});	
	
	
    // 중복 확인 상태를 저장할 변수
    let isIdChecked = false;
    let checkedId = '';

    // 중복 확인 버튼 클릭 이벤트 핸들러
    function checkIdDuplicate(event) {
        event.preventDefault();
        
        const idInput = document.getElementById('id');
        const id = idInput.value.trim();
        
        // 아이디 입력 여부 검사
        if (!id) {
            alert('아이디를 입력해주세요.');
            return;
        }
        
        // 아이디 형식 검사 (4~20자 영문, 숫자)
        if (!/^[a-zA-Z0-9]{4,20}$/.test(id)) {
            alert('아이디는 4~20자의 영문과 숫자만 사용 가능합니다.');
            return;
        }
        
        // 서버에 중복 확인 요청
        axios.post('/checkId', null, {
            params: { id: id }
        })
        .then(function(response) {
            if (response.data === 'duplicate') {
                alert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
                idInput.value = ''; // 중복된 경우 입력값 초기화
                idInput.focus(); // 입력 필드에 포커스
                isIdChecked = false;
            } else {
                alert('사용 가능한 아이디입니다.');
                handleIdCheckSuccess(id);
            }
        })
        .catch(function(error) {
            console.error('중복 확인 실패:', error);
            alert('중복 확인에 실패했습니다. 다시 시도해주세요.');
        });
    }

    // 중복 확인 성공 시 처리
    function handleIdCheckSuccess(id) {
        isIdChecked = true;
        checkedId = id;
        // 기존 오류 메시지 제거
        const existingError = document.querySelector('.error-message[data-field="id"]');
        if (existingError) {
            existingError.remove();
        }
    }

    // 중복 확인 버튼 클릭 이벤트 리스너 추가
    document.querySelector('.duplicate-check-btn').addEventListener('click', checkIdDuplicate);

    // 아이디 입력 필드 변경 시 중복 확인 상태 초기화
    document.getElementById('id').addEventListener('input', function() {
        if (this.value !== checkedId) {
            isIdChecked = false;
        }
    });

    // 모든 오류 메시지 제거 함수
    function clearAllErrorMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // 특정 필드에 오류 메시지 표시 함수
    function showError(fieldName, message) {
        // 이미 오류 메시지가 있으면 제거
        const existingError = document.querySelector(`.error-message[data-field="${fieldName}"]`);
        if (existingError) {
            existingError.remove();
        }

        // 새 오류 메시지 생성
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.setAttribute('data-field', fieldName);

        // 해당 필드 그룹 찾기
        let fieldGroup;
        if (fieldName === 'general') {
            fieldGroup = document.querySelector('.join-form');
        } else if (fieldName === 'pw-confirm') {
            fieldGroup = document.querySelector('input[name="pw-confirm"]').closest('.form-group');
        } else {
            fieldGroup = document.getElementById(fieldName).closest('.form-group');
        }

        // 오류 메시지 추가
        fieldGroup.appendChild(errorElement);
    }

    // 폼 유효성 검사 함수
    function validateForm() {
        let isValid = true;
        clearAllErrorMessages();

        // 아이디 검사
        const id = document.getElementById('id').value;
        if (!id) {
            showError('id', '아이디를 입력해주세요.');
            isValid = false;
        } else if (!/^[a-zA-Z0-9]{4,20}$/.test(id)) {
            showError('id', '아이디는 4~20자의 영문과 숫자만 사용 가능합니다.');
            isValid = false;
        } else if (!isIdChecked || checkedId !== id) {
            showError('id', '아이디 중복 확인을 해주세요.');
            isValid = false;
        }

        // 비밀번호 검사 (8~20자, 영문+숫자+특수문자 조합)
        const pw = document.getElementById('pw').value;
        if (!pw) {
            showError('pw', '비밀번호를 입력해주세요.');
            isValid = false;
        } else if (!/^(?=.*[a-zA-Z])(?=.*[0-9]).{8,20}$/.test(pw)) {
            showError('pw', '비밀번호는 8~20자의 영문, 숫자 조합이어야 합니다.');
            isValid = false;
        }

        // 비밀번호 확인 검사
        const pwConfirm = document.querySelector('input[name="pw-confirm"]').value;
        if (!pwConfirm) {
            showError('pw-confirm', '비밀번호 확인을 입력해주세요.');
            isValid = false;
        } else if (pw !== pwConfirm) {
            showError('pw-confirm', '비밀번호가 일치하지 않습니다.');
            isValid = false;
        }

        // 이름 검사 (한영 2~10자)
        const name = document.getElementById('name').value;
        if (!name) {
            showError('name', '이름을 입력해주세요.');
            isValid = false;
        } else if (!/^[가-힣A-Za-z]{2,10}$/.test(name)) {
            showError('name', '이름은 한글,영문 2~10자로 입력해주세요.');
            isValid = false;
        }

        // 휴대폰 번호 검사
        const tel1 = document.getElementById('tel-1').value;
        const tel2 = document.getElementById('tel-2').value;
        const tel3 = document.getElementById('tel-3').value;
        if (!tel1 || !tel2 || !tel3) {
            showError('tel-1', '휴대폰 번호를 모두 입력해주세요.');
            isValid = false;
        } else if (!/^\d{3}$/.test(tel1) || !/^\d{3,4}$/.test(tel2) || !/^\d{4}$/.test(tel3)) {
            showError('tel-1', '휴대폰 번호 형식이 올바르지 않습니다.');
            isValid = false;
        }

        // 이메일 검사
        const email = document.getElementById('email').value;
        const emailDomain = document.getElementById('email-domain').value;
        if (!email) {
            showError('email', '이메일을 입력해주세요.');
            isValid = false;
        } else if (!/^[a-zA-Z0-9._-]+$/.test(email)) {
            showError('email', '이메일 형식이 올바르지 않습니다.');
            isValid = false;
        }
        if (!emailDomain) {
            showError('email-domain', '이메일 도메인을 선택해주세요.');
            isValid = false;
        }

        return isValid;
    }

    // 회원가입 버튼 클릭 이벤트 처리
	document.getElementById('joinBtn').addEventListener('click', function(e) {
	    e.preventDefault();
	  
		// 유효성 검사 수행
		if (validateForm()) {
		    // 폼 데이터 수집
		    const formData = {
		        id: document.getElementById('id').value,
		        pw: document.getElementById('pw').value,
		        name: document.getElementById('name').value,
		        'tel-0': document.getElementById('tel-0').value,
		        'tel-1': document.getElementById('tel-1').value,
		        'tel-2': document.getElementById('tel-2').value,
		        'tel-3': document.getElementById('tel-3').value,
		        email: document.getElementById('email').value,
		        'email-domain': document.getElementById('email-domain').value,
		    };

		    // 폼을 생성하여 /join.do로 전송
		    const form = document.createElement('form');
		    form.method = 'POST';
		    form.action = '/join.do'; // 회원가입 처리 컨트롤러 URL
		    
		    // 데이터를 hidden input으로 추가
		    for (const key in formData) {
		        if (formData.hasOwnProperty(key)) {
		            const input = document.createElement('input');
		            input.type = 'hidden';
		            input.name = key;
		            input.value = formData[key];
		            form.appendChild(input);
		        }
		    }
		    
		    document.body.appendChild(form);
		    form.submit();		
		
        }
    });
});

