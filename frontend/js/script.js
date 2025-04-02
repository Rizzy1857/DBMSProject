// ===== CONFIGURATION =====
const API_URL = 'http://localhost:3000/api';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json'
};

// ===== DOM ELEMENTS =====
const elements = {
  tabs: {
    buttons: document.querySelectorAll('.tab-button'),
    contents: document.querySelectorAll('.tab-content')
  },
  forms: {
    patient: document.getElementById('patientForm'),
    doctor: document.getElementById('doctorForm'),
    appointment: document.getElementById('appointmentForm')
  },
  lists: {
    patient: document.getElementById('patientList'),
    doctor: document.getElementById('doctorList'),
    appointment: document.getElementById('appointmentList')
  },
  selects: {
    patient: document.getElementById('appointmentPatient'),
    doctor: document.getElementById('appointmentDoctor')
  }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
  setupTabs();
  setupEventListeners();
  await loadInitialData();
}

// ===== TAB MANAGEMENT =====
function setupTabs() {
  elements.tabs.buttons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });
}

async function switchTab(tabId) {
  // Update UI
  elements.tabs.buttons.forEach(btn => btn.classList.remove('active'));
  elements.tabs.contents.forEach(content => content.classList.remove('active'));
  
  document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`${tabId}-tab`).classList.add('active');

  // Load data for the tab
  try {
    switch(tabId) {
      case 'patients': await fetchPatients(); break;
      case 'doctors': await fetchDoctors(); break;
      case 'appointments': await fetchAppointments(); break;
    }
  } catch (error) {
    console.error(`Error loading ${tabId}:`, error);
    showMessage(elements.lists[tabId], `Failed to load ${tabId}`, 'error');
  }
}

// ===== DATA LOADING =====
async function loadInitialData() {
  try {
    await Promise.all([
      fetchPatients(),
      fetchDoctors()
    ]);
  } catch (error) {
    console.error('Initial data loading failed:', error);
  }
}

// ===== PATIENT FUNCTIONS =====
async function fetchPatients() {
  try {
    elements.lists.patient.innerHTML = '<p>Loading patients...</p>';
    const response = await fetch(`${API_URL}/patients`);
    
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    
    const patients = await response.json();
    displayPatients(patients);
    populatePatientDropdown(patients);
  } catch (error) {
    elements.lists.patient.innerHTML = '<p class="error-message">Failed to load patients</p>';
    throw error;
  }
}

function displayPatients(patients) {
  if (!patients.length) {
    elements.lists.patient.innerHTML = '<p>No patients found</p>';
    return;
  }

  elements.lists.patient.innerHTML = patients.map(patient => `
    <div class="card">
      <h4>${patient.name}</h4>
      <p><strong>Age:</strong> ${patient.age}</p>
      <p><strong>Gender:</strong> ${patient.gender}</p>
      <p><strong>Contact:</strong> ${patient.contact}</p>
      ${patient.address ? `<p><strong>Address:</strong> ${patient.address}</p>` : ''}
      <div class="meta">
        <button class="btn-delete" data-id="${patient.id}" data-type="patient">Delete</button>
      </div>
    </div>
  `).join('');
}

// ===== DOCTOR FUNCTIONS =====
async function fetchDoctors() {
  try {
    elements.lists.doctor.innerHTML = '<p>Loading doctors...</p>';
    const response = await fetch(`${API_URL}/doctors`);
    
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    
    const doctors = await response.json();
    displayDoctors(doctors);
    populateDoctorDropdown(doctors);
  } catch (error) {
    elements.lists.doctor.innerHTML = '<p class="error-message">Failed to load doctors</p>';
    throw error;
  }
}

function displayDoctors(doctors) {
  if (!doctors.length) {
    elements.lists.doctor.innerHTML = '<p>No doctors found</p>';
    return;
  }

  elements.lists.doctor.innerHTML = doctors.map(doctor => `
    <div class="card">
      <h4>Dr. ${doctor.name}</h4>
      <p><strong>Specialization:</strong> ${doctor.specialization}</p>
      <p><strong>Contact:</strong> ${doctor.contact}</p>
      ${doctor.department ? `<p><strong>Department:</strong> ${doctor.department}</p>` : ''}
      <div class="meta">
        <button class="btn-delete" data-id="${doctor.id}" data-type="doctor">Delete</button>
      </div>
    </div>
  `).join('');
}

// ===== APPOINTMENT FUNCTIONS =====
async function fetchAppointments() {
  try {
    elements.lists.appointment.innerHTML = '<p>Loading appointments...</p>';
    const response = await fetch(`${API_URL}/appointments`);
    
    if (!response.ok) throw new Error(`Server returned ${response.status}`);
    
    const appointments = await response.json();
    
    // Fetch related patient and doctor data
    const enrichedAppointments = await Promise.all(
      appointments.map(async appointment => ({
        ...appointment,
        patient: await fetchPatient(appointment.patientId),
        doctor: await fetchDoctor(appointment.doctorId)
      }))
    );
    
    displayAppointments(enrichedAppointments);
  } catch (error) {
    elements.lists.appointment.innerHTML = '<p class="error-message">Failed to load appointments</p>';
    throw error;
  }
}

function displayAppointments(appointments) {
  if (!appointments.length) {
    elements.lists.appointment.innerHTML = '<p>No appointments found</p>';
    return;
  }

  elements.lists.appointment.innerHTML = appointments.map(appt => {
    const date = new Date(appt.date);
    return `
      <div class="card">
        <h4>Appointment #${appt.id}</h4>
        <p><strong>Patient:</strong> ${appt.patient?.name || 'Unknown'}</p>
        <p><strong>Doctor:</strong> ${appt.doctor ? 'Dr. ' + appt.doctor.name : 'Unknown'}</p>
        <p><strong>Date:</strong> ${date.toLocaleString()}</p>
        <p><strong>Reason:</strong> ${appt.reason}</p>
        <div class="meta">
          <button class="btn-delete" data-id="${appt.id}" data-type="appointment">Cancel</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== DROPDOWN POPULATION =====
function populatePatientDropdown(patients) {
  elements.selects.patient.innerHTML = patients.map(patient => 
    `<option value="${patient.id}">${patient.name} (${patient.contact})</option>`
  ).join('');
}

function populateDoctorDropdown(doctors) {
  elements.selects.doctor.innerHTML = doctors.map(doctor => 
    `<option value="${doctor.id}">Dr. ${doctor.name} (${doctor.specialization})</option>`
  ).join('');
}

// ===== DATA FETCHING HELPERS =====
async function fetchPatient(id) {
  try {
    const response = await fetch(`${API_URL}/patients/${id}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
}

async function fetchDoctor(id) {
  try {
    const response = await fetch(`${API_URL}/doctors/${id}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error('Error fetching doctor:', error);
    return null;
  }
}

// ===== FORM HANDLING =====
function setupEventListeners() {
  // Form submissions
  elements.forms.patient.addEventListener('submit', handlePatientSubmit);
  elements.forms.doctor.addEventListener('submit', handleDoctorSubmit);
  elements.forms.appointment.addEventListener('submit', handleAppointmentSubmit);
  
  // Delete buttons (event delegation)
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('btn-delete')) {
      const { id, type } = e.target.dataset;
      await handleDelete(id, type);
    }
  });
}

async function handlePatientSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  
  const patientData = {
    name: form.querySelector('#patientName').value,
    age: form.querySelector('#patientAge').value,
    gender: form.querySelector('#patientGender').value,
    contact: form.querySelector('#patientContact').value,
    address: form.querySelector('#patientAddress').value || null
  };

  try {
    button.disabled = true;
    button.innerHTML = 'Saving...';
    
    const response = await fetch(`${API_URL}/patients`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(patientData)
    });

    if (!response.ok) throw new Error('Failed to save patient');
    
    form.reset();
    showMessage(elements.lists.patient, 'Patient added successfully!');
    await fetchPatients();
  } catch (error) {
    showMessage(elements.lists.patient, error.message, 'error');
    console.error('Error saving patient:', error);
  } finally {
    button.disabled = false;
    button.textContent = 'Add Patient';
  }
}

async function handleDoctorSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  
  const doctorData = {
    name: form.querySelector('#doctorName').value,
    specialization: form.querySelector('#doctorSpecialization').value,
    contact: form.querySelector('#doctorContact').value,
    department: form.querySelector('#doctorDepartment').value || null
  };

  try {
    button.disabled = true;
    button.innerHTML = 'Saving...';
    
    const response = await fetch(`${API_URL}/doctors`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(doctorData)
    });

    if (!response.ok) throw new Error('Failed to save doctor');
    
    form.reset();
    showMessage(elements.lists.doctor, 'Doctor added successfully!');
    await fetchDoctors();
  } catch (error) {
    showMessage(elements.lists.doctor, error.message, 'error');
    console.error('Error saving doctor:', error);
  } finally {
    button.disabled = false;
    button.textContent = 'Add Doctor';
  }
}

async function handleAppointmentSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const button = form.querySelector('button[type="submit"]');
  
  const appointmentData = {
    patientId: form.querySelector('#appointmentPatient').value,
    doctorId: form.querySelector('#appointmentDoctor').value,
    date: form.querySelector('#appointmentDate').value,
    reason: form.querySelector('#appointmentReason').value
  };

  try {
    button.disabled = true;
    button.innerHTML = 'Scheduling...';
    
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(appointmentData)
    });

    if (!response.ok) throw new Error('Failed to schedule appointment');
    
    form.reset();
    showMessage(elements.lists.appointment, 'Appointment scheduled successfully!');
    await fetchAppointments();
  } catch (error) {
    showMessage(elements.lists.appointment, error.message, 'error');
    console.error('Error scheduling appointment:', error);
  } finally {
    button.disabled = false;
    button.textContent = 'Schedule Appointment';
  }
}

async function handleDelete(id, type) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
  
  try {
    const response = await fetch(`${API_URL}/${type}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error(`Failed to delete ${type}`);
    
    showMessage(elements.lists[type], `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`);
    
    // Refresh the appropriate data
    switch(type) {
      case 'patient':
        await fetchPatients();
        break;
      case 'doctor':
        await fetchDoctors();
        break;
      case 'appointment':
        await fetchAppointments();
        break;
    }
  } catch (error) {
    showMessage(elements.lists[type], error.message, 'error');
    console.error(`Error deleting ${type}:`, error);
  }
}

// ===== UTILITY FUNCTIONS =====
function showMessage(container, message, type = 'success') {
  const messageElement = document.createElement('div');
  messageElement.className = `${type}-message`;
  messageElement.textContent = message;
  
  container.prepend(messageElement);
  setTimeout(() => messageElement.remove(), 5000);
}