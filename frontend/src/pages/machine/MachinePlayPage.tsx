import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getActiveMachineDetails } from '../../api/axiosMachine';
import { getInstanceByMachine } from '../../api/axiosInstance';
import DisplayReward from '../../components/play/DisplayReward';
import GetHints from '../../components/play/GetHints';
import StartInstanceButton from '../../components/play/StartInstanceButton';
import DownloadVPNProfile from '../../components/play/DownloadVPNProfile';
import InstanceInfo from '../../components/play/InstanceInfo';
import SubmitFlagForm from '../../components/play/SubmitFlagForm';
import GiveUpButton from '../../components/play/GiveUpButton';
import Main from '../../components/main/Main';
import { Instance } from '../../types/Instance';

/**
 * Interface representing the Machine details.
 */
interface Machine {
  _id: string; // Assuming MongoDB-style IDs
  name: string;
  exp: number;
  amiId: string;
  // Add other machine properties as needed
}

/**
 * Interface for API response when fetching machine details.
 */
interface GetMachineDetailsResponse {
  machine: Machine;
  // Add other response properties if available
}

/**
 * Component representing the Machine Play Page.
 */
const MachinePlayPage: React.FC = () => {
  const { machineId } = useParams<{ machineId: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<Instance['status']>(null);
  const [instanceStarted, setInstanceStarted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch machine details and check for existing instance when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!machineId) {
        setError('Machine ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch machine details
        const machineResponse: GetMachineDetailsResponse = await getActiveMachineDetails(machineId);
        console.log('Machine Details:', machineResponse.machine); // Debugging
        setMachine(machineResponse.machine);

        // Fetch existing instances for the machine
        const instanceResponse = await getInstanceByMachine(machineId);
        console.log('Instance Response:', instanceResponse); // Debugging

        if (instanceResponse.instances && instanceResponse.instances.length > 0) {
          setInstanceStarted(true);
          // Set initial instance status
          const currentInstance = instanceResponse.instances[0];
          setInstanceStatus(currentInstance.status);
          console.log('Existing Instance Found:', currentInstance); // Debugging
        } else {
          setInstanceStarted(false);
          setInstanceStatus(null);
          console.log('No Existing Instance Found'); // Debugging
        }
      } catch (error: any) {
        console.error('Error fetching machine details or instances:', error);
        setError('Failed to fetch machine details or instances.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [machineId]);

  // Callback to receive instance status from InstanceInfo
  const handleInstanceStatusChange = (status: Instance['status']) => {
    console.log('Instance status changed to:', status); // Debugging
    setInstanceStatus(status);
  };

  // Callback to set instance as started
  const handleInstanceStarted = () => {
    console.log('Instance has been started.'); // Debugging
    setInstanceStarted(true);
  };

  if (error) {
    return (
      <Main>
        <div className="machine-play-container">
          <h2>Machine Play</h2>
          <div className="error-message">{error}</div>
        </div>
      </Main>
    );
  }

  if (!machine || isLoading) {
    return (
      <Main>
        <div className="machine-play-container">
          <h2>Machine Play</h2>
          <div>Loading machine details...</div>
        </div>
      </Main>
    );
  }

  // Determine if controls should be disabled based on instance status
  const isRunning = instanceStatus === 'running';

  return (
    <Main>
      <div className="machine-play-container">
        <div className="machine-play-title">
          <h2>Machine Play</h2>
        </div>
        <div className="machine-play-name">
          <h3>Now Playing: {machine.name}</h3>
        </div>
        <DisplayReward reward={machine.exp} />
        <DownloadVPNProfile />

        {/* Conditionally render StartInstanceButton or InstanceInfo */}
        {!instanceStarted ? (
          <StartInstanceButton
            machineId={machineId || ''}
            onInstanceStarted={handleInstanceStarted} // Pass the callback
          />
        ) : (
          <InstanceInfo
            machineId={machineId || ''}
            onStatusChange={handleInstanceStatusChange}
          />
        )}

        <GetHints
          machineId={machineId || ''}
          playType="machine"
          disabled={!isRunning} // Disable based on instance status
        />
        <SubmitFlagForm
          machineId={machineId || ''}
          playType="machine"
          disabled={!isRunning} // Disable based on instance status
        />
        <GiveUpButton
          machineId={machineId || ''}
          machineName={machine.name}
          mode="machine"
          //disabled={!isRunning} // Disable based on instance status
        />
      </div>
    </Main>
  );
};

export default MachinePlayPage;