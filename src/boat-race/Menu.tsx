import { useState } from 'react'
import { GameMode } from './types'
import { PRESET_COURSES, PresetCourse } from './presetCourses'
import { getBestTime, formatTime } from './storage'

interface MenuProps {
  onStartGame: (mode: GameMode, courseId?: string) => void
  initialMode?: 'single-player' | 'two-player' | null
}

export function Menu({ onStartGame, initialMode = null }: MenuProps) {
  const [selectedMode, setSelectedMode] = useState<'single-player' | 'two-player' | null>(initialMode)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  const handleModeSelect = (mode: 'single-player' | 'two-player') => {
    setSelectedMode(mode)
    setSelectedCourse(null)
  }

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId)
  }

  const handleStart = () => {
    if (selectedMode === 'two-player') {
      onStartGame('two-player')
    } else if (selectedMode === 'single-player' && selectedCourse) {
      onStartGame('single-player', selectedCourse)
    }
  }

  const handleBack = () => {
    if (selectedCourse) {
      setSelectedCourse(null)
    } else {
      setSelectedMode(null)
    }
  }

  const getDifficultyColor = (difficulty: PresetCourse['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return '#4CAF50'
      case 'Medium':
        return '#FF9800'
      case 'Hard':
        return '#F44336'
    }
  }

  return (
    <div
      style={{
        width: 1200,
        height: 800,
        margin: '0 auto',
        background: 'linear-gradient(180deg, #1E90FF 0%, #0066CC 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        border: '2px solid #333',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Water wave effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 19px,
            rgba(255, 255, 255, 0.05) 19px,
            rgba(255, 255, 255, 0.05) 20px
          )`,
          pointerEvents: 'none',
        }}
      />

      <h1
        style={{
          fontSize: 64,
          color: '#FFFFFF',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
          marginBottom: 20,
          letterSpacing: 4,
        }}
      >
        🚤 BOAT RACE
      </h1>

      {!selectedMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 40 }}>
          <button
            onClick={() => handleModeSelect('single-player')}
            style={{
              padding: '20px 60px',
              fontSize: 24,
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
              color: '#FFFFFF',
              border: '3px solid #2E7D32',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🏁 Single Player (Time Trial)
          </button>
          <button
            onClick={() => handleModeSelect('two-player')}
            style={{
              padding: '20px 60px',
              fontSize: 24,
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #2196F3 0%, #1976D2 100%)',
              color: '#FFFFFF',
              border: '3px solid #1565C0',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            👥 Two Players (Random Course)
          </button>
        </div>
      )}

      {selectedMode === 'single-player' && !selectedCourse && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
          <h2 style={{ color: '#FFFFFF', fontSize: 32, marginBottom: 30, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Select Course
          </h2>
          <div style={{ display: 'flex', gap: 30 }}>
            {PRESET_COURSES.map((course) => {
              const bestTime = getBestTime(course.id)
              return (
                <button
                  key={course.id}
                  onClick={() => handleCourseSelect(course.id)}
                  style={{
                    padding: 20,
                    width: 280,
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: '3px solid #333',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <div style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: '#333' }}>{course.name}</div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: 4,
                      background: getDifficultyColor(course.difficulty),
                      color: '#FFFFFF',
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginBottom: 12,
                    }}
                  >
                    {course.difficulty}
                  </div>
                  <div style={{ fontSize: 14, color: '#666', marginBottom: 15, lineHeight: 1.4 }}>
                    {course.description}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: bestTime ? '#4CAF50' : '#999',
                      fontWeight: bestTime ? 'bold' : 'normal',
                    }}
                  >
                    {bestTime ? `🏆 Best: ${formatTime(bestTime)}` : 'No best time yet'}
                  </div>
                </button>
              )
            })}
          </div>
          <button
            onClick={handleBack}
            style={{
              marginTop: 40,
              padding: '12px 40px',
              fontSize: 18,
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      )}

      {selectedMode === 'single-player' && selectedCourse && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
          {(() => {
            const course = PRESET_COURSES.find((c) => c.id === selectedCourse)!
            const bestTime = getBestTime(course.id)
            return (
              <>
                <h2
                  style={{ color: '#FFFFFF', fontSize: 36, marginBottom: 20, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                >
                  {course.name}
                </h2>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: 6,
                    background: getDifficultyColor(course.difficulty),
                    color: '#FFFFFF',
                    fontSize: 16,
                    fontWeight: 'bold',
                    marginBottom: 20,
                  }}
                >
                  {course.difficulty}
                </div>
                <p style={{ color: '#FFFFFF', fontSize: 18, marginBottom: 20, textAlign: 'center', maxWidth: 400 }}>
                  {course.description}
                </p>
                {bestTime && (
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '15px 30px',
                      borderRadius: 10,
                      marginBottom: 30,
                    }}
                  >
                    <div style={{ color: '#FFD700', fontSize: 16 }}>🏆 Best Time</div>
                    <div style={{ color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' }}>{formatTime(bestTime)}</div>
                  </div>
                )}
                <div style={{ color: '#FFFFFF', fontSize: 14, marginBottom: 30, opacity: 0.8 }}>
                  Checkpoints: {course.course.checkpoints.length}
                </div>
                <button
                  onClick={handleStart}
                  style={{
                    padding: '20px 80px',
                    fontSize: 28,
                    fontWeight: 'bold',
                    background: 'linear-gradient(180deg, #FF9800 0%, #F57C00 100%)',
                    color: '#FFFFFF',
                    border: '3px solid #E65100',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  START RACE
                </button>
                <button
                  onClick={handleBack}
                  style={{
                    marginTop: 20,
                    padding: '12px 40px',
                    fontSize: 18,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#FFFFFF',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
              </>
            )
          })()}
        </div>
      )}

      {selectedMode === 'two-player' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 20 }}>
          <h2 style={{ color: '#FFFFFF', fontSize: 36, marginBottom: 30, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Two Player Race
          </h2>
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.5)',
              padding: 30,
              borderRadius: 15,
              marginBottom: 30,
              textAlign: 'center',
            }}
          >
            <div style={{ color: '#8B4513', fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
              Player 1: Arrow Keys ↑↓←→
            </div>
            <div style={{ color: '#2E5A88', fontSize: 20, fontWeight: 'bold' }}>Player 2: WASD</div>
          </div>
          <p style={{ color: '#FFFFFF', fontSize: 16, marginBottom: 30, opacity: 0.8 }}>
            Race on a randomly generated course!
          </p>
          <button
            onClick={handleStart}
            style={{
              padding: '20px 80px',
              fontSize: 28,
              fontWeight: 'bold',
              background: 'linear-gradient(180deg, #FF9800 0%, #F57C00 100%)',
              color: '#FFFFFF',
              border: '3px solid #E65100',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            START RACE
          </button>
          <button
            onClick={handleBack}
            style={{
              marginTop: 20,
              padding: '12px 40px',
              fontSize: 18,
              background: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}
