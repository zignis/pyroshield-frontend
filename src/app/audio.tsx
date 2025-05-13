import React from 'react';
import { useAudioPlayer } from 'react-use-audio-player';
import { useAppSelector } from '@/app/store';

const Audio = (): null => {
    const thresholdExceededDevices = useAppSelector(
        (state) => state.thresholdExceededDevices
    );
    const shouldPlayAudio = React.useMemo(
        () => Object.values(thresholdExceededDevices).some(Boolean),
        [thresholdExceededDevices]
    );
    const { play, pause } = useAudioPlayer(
        process.env.NEXT_PUBLIC_SOUND_URL || '',
        {
            loop: true,
        }
    );

    React.useEffect(() => {
        if (shouldPlayAudio) {
            play();
        } else {
            pause();
        }
    }, [pause, play, shouldPlayAudio]);

    return null;
};

export default Audio;
