"""
Acoustic Feature Extraction for Voice Analysis
Extracts audio features that correlate with emotional state
"""
import numpy as np
import logging
from typing import Dict, Any, Optional
from pathlib import Path

try:
    import librosa
    import librosa.feature
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    librosa = None

try:
    import opensmile
    OPENSMILE_AVAILABLE = True
except ImportError:
    OPENSMILE_AVAILABLE = False
    opensmile = None

logger = logging.getLogger(__name__)


def extract_acoustic_features(audio_path: str, sample_rate: int = 16000) -> Dict[str, Any]:
    """
    Extract comprehensive acoustic features from audio file

    Args:
        audio_path: Path to audio file
        sample_rate: Target sample rate for processing

    Returns:
        Dictionary with acoustic features:
        - mfcc: MFCC features (mean, std, delta, delta-delta)
        - pitch: Pitch/F0 features (mean, std, min, max, range)
        - energy: Energy features (RMS energy statistics)
        - prosody: Speaking rate and pause characteristics
        - voice_quality: Voice quality indicators

    Raises:
        Exception: If librosa not available or processing fails
    """
    if not LIBROSA_AVAILABLE:
        raise Exception("librosa not installed. Install with: pip install librosa")

    if not Path(audio_path).exists():
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=sample_rate)

        # Extract all feature categories
        mfcc_features = extract_mfcc_features(y, sr)
        pitch_features = extract_pitch_features(y, sr)
        energy_features = extract_energy_features(y)
        prosody_features = extract_prosody_features(y, sr)
        voice_quality = extract_voice_quality(y, sr)
        
        # Clinical biomarkers via openSMILE
        opensmile_features = extract_opensmile_features(audio_path)

        return {
            "mfcc": mfcc_features,
            "pitch": pitch_features,
            "energy": energy_features,
            "prosody": prosody_features,
            "voice_quality": voice_quality,
            "opensmile_biomarkers": opensmile_features,
            "duration_seconds": len(y) / sr,
            "sample_rate": sr
        }

    except Exception as e:
        logger.error(f"Feature extraction failed: {e}")
        raise Exception(f"Failed to extract acoustic features: {str(e)}")

def extract_opensmile_features(audio_path: str) -> Dict[str, Any]:
    """
    Extract clinical vocal biomarkers using openSMILE's eGeMAPSv02 feature set.
    Captures exact Pitch (F0), Jitter, Shimmer, and HNR which broadly correlate 
    with psychological fatigue, stress, and tension.
    """
    if not OPENSMILE_AVAILABLE:
        logger.warning("opensmile not installed. Skipping clinical biomarker extraction.")
        return {}

    try:
        smile = opensmile.Smile(
            feature_set=opensmile.FeatureSet.eGeMAPSv02,
            feature_level=opensmile.FeatureLevel.Functionals,
        )
        df = smile.process_file(audio_path)
        
        # Convert the first valid row of the pandas dataframe to a dictionary
        if not df.empty:
            # Replace NaNs with None/null for JSON compatibility
            df_cleaned = df.replace({np.nan: None})
            return df_cleaned.iloc[0].to_dict()
        return {}
    except Exception as e:
        logger.error(f"openSMILE extraction failed: {e}")
        return {}

def extract_mfcc_features(y: np.ndarray, sr: int, n_mfcc: int = 13) -> Dict[str, Any]:
    """
    Extract MFCC (Mel-Frequency Cepstral Coefficients) features

    MFCCs capture the spectral envelope of audio and are robust indicators
    of vocal characteristics that correlate with emotional state.

    Args:
        y: Audio time series
        sr: Sample rate
        n_mfcc: Number of MFCC coefficients (default 13)

    Returns:
        Dictionary with MFCC statistics
    """
    # Compute MFCCs
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)

    # Compute deltas (velocity) and delta-deltas (acceleration)
    mfccs_delta = librosa.feature.delta(mfccs)
    mfccs_delta2 = librosa.feature.delta(mfccs, order=2)

    return {
        "mean": mfccs.mean(axis=1).tolist(),  # 13 values
        "std": mfccs.std(axis=1).tolist(),    # 13 values
        "delta_mean": mfccs_delta.mean(axis=1).tolist(),   # 13 values
        "delta_std": mfccs_delta.std(axis=1).tolist(),     # 13 values
        "delta2_mean": mfccs_delta2.mean(axis=1).tolist(), # 13 values
        "delta2_std": mfccs_delta2.std(axis=1).tolist(),   # 13 values
        "total_features": n_mfcc * 6  # mean + std for mfcc, delta, delta2 = 78 features
    }


def extract_pitch_features(y: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract pitch (fundamental frequency F0) features

    Pitch variation is a key prosodic feature that reflects emotional arousal.
    Low pitch variation suggests calm/depressed states, high variation suggests
    excitement or anxiety.

    Args:
        y: Audio time series
        sr: Sample rate

    Returns:
        Dictionary with pitch statistics
    """
    # Use Pyin algorithm for pitch detection (more robust than piptrack)
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=librosa.note_to_hz('C2'),  # 65 Hz
        fmax=librosa.note_to_hz('C7')   # 2093 Hz
    )

    # Filter out unvoiced frames (where f0 is NaN)
    f0_voiced = f0[~np.isnan(f0)]

    if len(f0_voiced) == 0:
        # No voiced segments detected
        return {
            "f0_mean": 0.0,
            "f0_std": 0.0,
            "f0_min": 0.0,
            "f0_max": 0.0,
            "f0_range": 0.0,
            "f0_median": 0.0,
            "voiced_ratio": 0.0
        }

    return {
        "f0_mean": float(np.mean(f0_voiced)),
        "f0_std": float(np.std(f0_voiced)),
        "f0_min": float(np.min(f0_voiced)),
        "f0_max": float(np.max(f0_voiced)),
        "f0_range": float(np.max(f0_voiced) - np.min(f0_voiced)),
        "f0_median": float(np.median(f0_voiced)),
        "voiced_ratio": float(len(f0_voiced) / len(f0))  # Proportion of voiced frames
    }


def extract_energy_features(y: np.ndarray) -> Dict[str, float]:
    """
    Extract energy (loudness/amplitude) features

    Energy levels reflect arousal and intensity of emotion.
    High energy suggests excitement, anger, or stress.
    Low energy suggests calm, sadness, or fatigue.

    Args:
        y: Audio time series

    Returns:
        Dictionary with energy statistics
    """
    # Compute RMS (Root Mean Square) energy
    rms = librosa.feature.rms(y=y)[0]

    # Compute zero crossing rate (indicator of signal noisiness/periodicity)
    zcr = librosa.feature.zero_crossing_rate(y)[0]

    return {
        "rms_mean": float(np.mean(rms)),
        "rms_std": float(np.std(rms)),
        "rms_max": float(np.max(rms)),
        "rms_min": float(np.min(rms)),
        "rms_range": float(np.max(rms) - np.min(rms)),
        "zcr_mean": float(np.mean(zcr)),
        "zcr_std": float(np.std(zcr))
    }


def extract_prosody_features(y: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract prosody features (speaking rate, pauses, rhythm)

    Prosody reflects speech rhythm and timing, which varies with emotional state.
    Fast speech with few pauses suggests anxiety or excitement.
    Slow speech with many pauses suggests depression or thoughtfulness.

    Args:
        y: Audio time series
        sr: Sample rate

    Returns:
        Dictionary with prosody statistics
    """
    # Detect onset strength (for syllable/word boundary detection)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)

    # Detect onsets (syllable boundaries approximately)
    onsets = librosa.onset.onset_detect(
        onset_envelope=onset_env,
        sr=sr,
        units='time'
    )

    # Calculate speaking rate (syllables per second)
    duration = len(y) / sr
    speaking_rate = len(onsets) / duration if duration > 0 else 0

    # Compute tempogram for rhythm analysis
    tempogram = librosa.feature.tempogram(onset_envelope=onset_env, sr=sr)
    tempo_mean = float(np.mean(tempogram))
    tempo_std = float(np.std(tempogram))

    # Detect pauses (low energy regions)
    rms = librosa.feature.rms(y=y)[0]
    silence_threshold = np.mean(rms) * 0.1  # 10% of mean energy
    silent_frames = np.sum(rms < silence_threshold)
    total_frames = len(rms)
    pause_ratio = silent_frames / total_frames if total_frames > 0 else 0

    return {
        "speaking_rate": float(speaking_rate),  # syllables/second
        "onset_count": int(len(onsets)),
        "tempo_mean": tempo_mean,
        "tempo_std": tempo_std,
        "pause_ratio": float(pause_ratio)
    }


def extract_voice_quality(y: np.ndarray, sr: int) -> Dict[str, float]:
    """
    Extract voice quality indicators

    Voice quality features like spectral centroid and bandwidth
    can indicate tension, hoarseness, or breathiness in voice.

    Args:
        y: Audio time series
        sr: Sample rate

    Returns:
        Dictionary with voice quality metrics
    """
    # Spectral centroid (brightness of sound)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]

    # Spectral bandwidth (spread of frequencies)
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]

    # Spectral rolloff (frequency below which 85% of energy is contained)
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]

    # Spectral contrast (difference between peaks and valleys in spectrum)
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)

    return {
        "spectral_centroid_mean": float(np.mean(spectral_centroid)),
        "spectral_centroid_std": float(np.std(spectral_centroid)),
        "spectral_bandwidth_mean": float(np.mean(spectral_bandwidth)),
        "spectral_bandwidth_std": float(np.std(spectral_bandwidth)),
        "spectral_rolloff_mean": float(np.mean(spectral_rolloff)),
        "spectral_rolloff_std": float(np.std(spectral_rolloff)),
        "spectral_contrast_mean": float(np.mean(spectral_contrast)),
        "spectral_contrast_std": float(np.std(spectral_contrast))
    }


def summarize_acoustic_features(features: Dict[str, Any]) -> str:
    """
    Generate human-readable summary of acoustic features

    This summary can be used as context for GPT-4 emotion classification.

    Args:
        features: Acoustic features dictionary

    Returns:
        Natural language summary
    """
    pitch = features.get("pitch", {})
    energy = features.get("energy", {})
    prosody = features.get("prosody", {})

    speaking_rate = prosody.get("speaking_rate", 0)
    pitch_std = pitch.get("f0_std", 0)
    energy_mean = energy.get("rms_mean", 0)
    pause_ratio = prosody.get("pause_ratio", 0)

    # Interpret speaking rate
    if speaking_rate < 2.0:
        rate_desc = "slow"
    elif speaking_rate > 3.5:
        rate_desc = "fast"
    else:
        rate_desc = "moderate"

    # Interpret pitch variation
    if pitch_std < 20:
        pitch_desc = "monotone (low variation)"
    elif pitch_std > 40:
        pitch_desc = "highly varied"
    else:
        pitch_desc = "moderate variation"

    # Interpret energy
    if energy_mean < 0.1:
        energy_desc = "low energy/quiet"
    elif energy_mean > 0.3:
        energy_desc = "high energy/loud"
    else:
        energy_desc = "moderate energy"

    # Interpret pauses
    if pause_ratio > 0.3:
        pause_desc = "frequent pauses"
    elif pause_ratio < 0.1:
        pause_desc = "minimal pauses"
    else:
        pause_desc = "normal pausing"

    summary = f"""Speaking rate: {speaking_rate:.1f} syllables/sec ({rate_desc})
Pitch variation: {pitch_std:.1f} Hz ({pitch_desc})
Energy level: {energy_mean:.2f} ({energy_desc})
Pause pattern: {pause_ratio:.1%} silence ({pause_desc})"""

    return summary
