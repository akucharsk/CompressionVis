import React, {useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Menu.css';
import { useSettings } from "../context/SettingsContext";
import VideoPlayer from "../components/videoPreview/VideoPlayer";
import VideoSelect from "../components/videoPreview/VideoSelect";
import OptionsSection from "../components/videoPreview/OptionsSelection";
import {apiUrl} from "../utils/urls";
import {useError} from "../context/ErrorContext";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { genericFetch } from '../api/genericFetch';
import { defaultRetryPolicy, defaultRefetchIntervalPolicy } from '../utils/retryUtils';
import Spinner from '../components/Spinner';

function Menu() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { parameters, setParameters } = useSettings();
    const {showError} = useError();

    const mutationFn = useCallback(async () => {
        let endpoint, requestBody;

        if (parameters.mode === "compressedSize") {
            endpoint = `${apiUrl}/video/size-compress/`;
            requestBody = {
                videoId: parameters.videoId,
                targetSize: parseInt(parameters.compressedSize)
            };
        } else {
            endpoint = `${apiUrl}/video/compress/`;
            requestBody = {
                resolution: parameters.resolution,
                videoId: parameters.videoId,
                gop_size: parseInt(parameters.pattern) || 1,
                preset: parameters.preset,
                bf: parameters.bFrames,
                aq_mode: parseInt(parameters.aqMode),
                aq_strength: parseFloat(parameters.aqStrength) || 1.0,
                ...(parameters.qualityMode === "crf" && {crf: parseInt(parameters.crf)}),
                ...(parameters.qualityMode === "bandwidth" && {bandwidth: parameters.bandwidth}),
            };
        }
        const data = await genericFetch(endpoint, {
            method: "POST",
            body: JSON.stringify(requestBody),
            headers: {
                "Content-Type": "application/json",
            },
        });
        return data;
    }, [ parameters ]);

    const onSuccess = useCallback((data) => {
        const videoId = data.videoId;
        if (!videoId) {
            showError("Invalid data received. " + data?.message);
            return;
        }
        if (data.resultingSize) {
            setParameters((prev) => ({
                ...prev,
                resultingSize: data.resultingSize,
            }));
        }
        queryClient.invalidateQueries({ queryKey: ["compressed-videos"] });
        navigate(`/compress?videoId=${videoId}&originalVideoId=${parameters.videoId}`);
    }, [ parameters, setParameters, navigate, showError, queryClient ]);

    const compressionMutation = useMutation({
        mutationFn,
        onSuccess,
        retry: defaultRetryPolicy,
        refetchInterval: defaultRefetchIntervalPolicy
    });

    const handleShowDifferences = () => {
        if (!parameters.videoId) {
            showError("Please select a video first.");
            return;
        }

        navigate(`/differences?videoId=${parameters.videoId}`);
    };

    return (
        <div className="container">
            {compressionMutation.isPending && (
                <div className="loading-overlay">
                    <Spinner />
                </div>
            )}
            <div className="video-section">
                <h2>Video Preview</h2>
                <VideoPlayer />
                <h2>Video Source</h2>
                <VideoSelect />
            </div>
            <OptionsSection
                handleCompress={() => compressionMutation.mutate()}
                handleShowDifferences={handleShowDifferences}
            />
        </div>
    );
}

export default Menu;