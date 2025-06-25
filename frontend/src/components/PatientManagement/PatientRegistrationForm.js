import React, { useState } from 'react';
import { registerPatient } from '../../services/djangoApiService';

const PatientRegistrationForm = ({ onRegistrationSuccess }) => {
    const [givenName, setGivenName] = useState('');
    const [familyName, setFamilyName] = useState('');
    const [gender, setGender] = useState('M');
    const [birthdate, setBirthdate] = useState('');
    const [identifier, setIdentifier] = useState('');
    const [address1, setAddress1] = useState('');
    const [cityVillage, setCityVillage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); setSuccessMessage(''); setLoading(true);
        try {
            const patientDataToRegister = {
                givenName,
                familyName,
                gender,
                birthdate,
                identifier,
                address1,
                cityVillage,
                phoneNumber
            };
            console.log("[PatientRegistrationForm] Data to send to Django:", patientDataToRegister);
            const registeredPatient = await registerPatient(patientDataToRegister);

            const displayIdentifier = registeredPatient.identifiers && registeredPatient.identifiers.length > 0
                                         ? registeredPatient.identifiers[0].identifier
                                         : identifier;

            setSuccessMessage(`환자 [${registeredPatient.display || `${givenName} ${familyName}`}] 등록 성공! UUID: ${registeredPatient.uuid}, Identifier: ${displayIdentifier}`);
            setGivenName(''); setFamilyName(''); setGender('M'); setBirthdate('');
            setIdentifier('');
            setAddress1(''); setCityVillage(''); setPhoneNumber('');
            if (onRegistrationSuccess) {
                onRegistrationSuccess();
            }
        } catch (err) {
            console.error("[PatientRegistrationForm] Error:", err);
            let detailedErrorMessage = `환자 등록 실패: ${err.message || '알 수 없는 오류'}`;
            if (err.response && err.response.data && err.response.data.error) {
                detailedErrorMessage += ` 상세: ${err.response.data.detail || err.response.data.error}`;
            } else if (err.response) {
                detailedErrorMessage = `환자 등록 실패 (Django 응답): ${err.response.status} - ${err.response.statusText}.`;
                if (typeof err.response.data === 'string' && err.response.data.toLowerCase().includes('<html')) {
                    detailedErrorMessage += " (Django 서버에서 HTML 오류 페이지를 반환했습니다. Django 로그를 확인하세요.)";
                } else if (err.response.data && typeof err.response.data === 'object') {
                    detailedErrorMessage += ` 서버 응답: ${JSON.stringify(err.response.data)}`;
                }
            } else if (err.request) {
                detailedErrorMessage = '환자 등록 실패: Django 서버에서 응답이 없습니다.';
            }
            setError(detailedErrorMessage);
        } finally { setLoading(false); }
    };

    return (
        <div style={{border: '1px solid #28a745', padding: '20px', borderRadius: '8px', marginTop: '20px', marginBottom: '20px'}}>
            <h4>새 환자 등록 (OpenMRS와 동기화)</h4>
            <form onSubmit={handleSubmit}>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px'}}>
                    <div><label>Given Name (이름):*</label><input type="text" value={givenName} onChange={(e) => setGivenName(e.target.value)} required style={{width: '90%', padding: '8px'}}/></div>
                    <div><label>Family Name (성):*</label><input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)} required style={{width: '90%', padding: '8px'}}/></div>
                    {/* Identifier 입력 필드 */}
                    <div><label>Identifier (환자 ID):*</label><input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required placeholder="예: TESTID001 (새롭고 고유한 ID)" style={{width: '90%', padding: '8px'}}/></div>
                    <div><label>Gender (성별):*</label><select value={gender} onChange={(e) => setGender(e.target.value)} style={{width: '95%', padding: '8px'}}><option value="M">Male</option><option value="F">Female</option><option value="O">Other</option></select></div>
                    <div style={{gridColumn: 'span 2'}}><label>Birthdate (생년월일):*</label><input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} required style={{width: 'calc(47.5% - 5px)', padding: '8px'}} /></div>
                    <div><label>Address 1 (주소 1):</label><input type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} style={{width: '90%', padding: '8px'}}/></div>
                    <div><label>City/Village (도시):</label><input type="text" value={cityVillage} onChange={(e) => setCityVillage(e.target.value)} style={{width: '90%', padding: '8px'}}/></div>
                    <div style={{gridColumn: 'span 2'}}><label>Phone Number (전화번호):</label><input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="예: 010-1234-5678" style={{width: 'calc(47.5% - 5px)', padding: '8px'}}/></div>
                </div>
                <button type="submit" disabled={loading} style={{marginTop: '15px', padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px'}}>
                    {loading ? '등록 중...' : '환자 등록'}
                </button>
                {error && <p style={{color: 'red', marginTop: '10px', whiteSpace: 'pre-wrap'}}>{error}</p>}
                {successMessage && <p style={{color: 'green', marginTop: '10px'}}>{successMessage}</p>}
            </form>
        </div>
    );
};

export default PatientRegistrationForm;