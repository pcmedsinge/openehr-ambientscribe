// Local demographics lookup — EHRbase stores only the patient ID (PARTY_SELF constraint).
// Name, DOB and gender live here, keyed by patient ID.

export interface PatientDemographics {
  id: string
  name: string
  dob: string    // YYYY-MM-DD
  gender: string
}

const PATIENTS: PatientDemographics[] = [
  { id: 'AMB-001', name: 'John Smith',         dob: '1965-03-15', gender: 'Male'   },
  { id: 'AMB-002', name: 'Mary Johnson',       dob: '1972-07-22', gender: 'Female' },
  { id: 'AMB-003', name: 'Robert Williams',    dob: '1958-11-08', gender: 'Male'   },
  { id: 'AMB-004', name: 'Patricia Brown',     dob: '1945-05-30', gender: 'Female' },
  { id: 'AMB-005', name: 'Michael Davis',      dob: '1980-09-14', gender: 'Male'   },
  { id: 'AMB-006', name: 'Linda Wilson',       dob: '1967-12-01', gender: 'Female' },
  { id: 'AMB-007', name: 'David Moore',        dob: '1975-04-17', gender: 'Male'   },
  { id: 'AMB-008', name: 'Barbara Taylor',     dob: '1952-08-25', gender: 'Female' },
  { id: 'AMB-009', name: 'James Anderson',     dob: '1963-02-11', gender: 'Male'   },
  { id: 'AMB-010', name: 'Susan Thomas',       dob: '1985-06-28', gender: 'Female' },
  { id: 'AMB-011', name: 'Thomas Jackson',     dob: '1948-10-05', gender: 'Male'   },
  { id: 'AMB-012', name: 'Jessica White',      dob: '1991-01-19', gender: 'Female' },
  { id: 'AMB-013', name: 'Christopher Harris', dob: '1956-07-31', gender: 'Male'   },
  { id: 'AMB-014', name: 'Sarah Martin',       dob: '1978-03-22', gender: 'Female' },
  { id: 'AMB-015', name: 'Charles Thompson',   dob: '1943-09-07', gender: 'Male'   },
  { id: 'AMB-016', name: 'Karen Garcia',       dob: '1969-11-14', gender: 'Female' },
  { id: 'AMB-017', name: 'Joseph Martinez',    dob: '1982-05-03', gender: 'Male'   },
  { id: 'AMB-018', name: 'Nancy Robinson',     dob: '1955-08-17', gender: 'Female' },
  { id: 'AMB-019', name: 'Matthew Clark',      dob: '1988-04-29', gender: 'Male'   },
  { id: 'AMB-020', name: 'Betty Rodriguez',    dob: '1960-12-08', gender: 'Female' },
]

const INDEX = new Map(PATIENTS.map(p => [p.id, p]))

export function getPatientById(id: string): PatientDemographics | undefined {
  return INDEX.get(id)
}

export function getAllPatients(): PatientDemographics[] {
  return PATIENTS
}
