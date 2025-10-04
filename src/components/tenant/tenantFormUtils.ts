
export function getInitialFormData() {
  return {
    name: '',
    email: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
  };
}
