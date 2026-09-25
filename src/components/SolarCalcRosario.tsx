import React from 'react';
import { LocationCoords } from '../types';
import { SolarCalcArgentina } from './SolarCalcArgentina';

interface SolarCalcRosarioProps {
  currentLocation: LocationCoords;
  onLocationChange: (loc: LocationCoords) => void;
}

export const SolarCalcRosario: React.FC<SolarCalcRosarioProps> = (props) => {
  return <SolarCalcArgentina {...props} />;
};

export default SolarCalcRosario;
