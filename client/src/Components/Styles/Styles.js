export const getButtonStyle = (type, isTouchScreen) => {
    switch (type) {
        case 'cancel':
            return `
              bg-gray-600
              ${isTouchScreen ? 'active:bg-gray-800 active:shadow-lg active:-translate-y-1' : 'hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-1'}
              text-white rounded-3xl duration-300 shadow-md font-roboto font-light
            `;
        
        case 'standard':
        default:
            return `
              bg-dark-main
              ${isTouchScreen ? 'active:bg-razoredgedark active:shadow-lg active:-translate-y-1' : 'hover:bg-razoredgedark hover:shadow-lg transform hover:-translate-y-1'}
              text-white rounded-3xl duration-300 shadow-md font-roboto font-light
            `;
    }
};

export const getErrorMessageStyle = () => {
    return 'text-dark-error font-medium text-sm';
  };
  

export const getInputStyle = () => {
  return 'transition duration-150 ease-in-out w-full px-2.5 py-1.5 rounded-md shadow-sm focus:outline-none focus:bg-dark-textfield-dark focus:shadow-md focus:shadow-dark-main/30 bg-dark-textfield text-white'
}
