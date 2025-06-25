import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PatientPage = () => {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patient_id: '',
    name: '',
    birth_date: '',
    gender: 'M',
    admission_date: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = () => {
    axios.get('/api/patients/')
      .then(res => setPatients(res.data))
      .catch(err => console.error(err));
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    axios.post('/api/patients/', form)
      .then(() => {
        fetchPatients();  // 등록 후 목록 갱신
        setForm({ patient_id: '', name: '', birth_date: '', gender: 'M', admission_date: '' });
      })
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h1>환자 목록</h1>

      <form onSubmit={handleSubmit}>
        <input name="patient_id" placeholder="환자 ID" value={form.patient_id} onChange={handleChange} />
        <input name="name" placeholder="이름" value={form.name} onChange={handleChange} />
        <input name="birth_date" placeholder="생년월일 (YYYY-MM-DD)" value={form.birth_date} onChange={handleChange} />
        <select name="gender" value={form.gender} onChange={handleChange}>
          <option value="M">남</option>
          <option value="F">여</option>
        </select>
        <input name="admission_date" placeholder="입원일 (YYYY-MM-DD)" value={form.admission_date} onChange={handleChange} />
        <button type="submit">등록</button>
      </form>

      <ul>
        {patients.map(p => (
          <li key={p.id}>{p.name} ({p.patient_id})</li>
        ))}
      </ul>
    </div>
  );
};

export default PatientPage;
