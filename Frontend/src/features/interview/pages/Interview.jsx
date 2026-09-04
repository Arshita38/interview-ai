import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import ReactMarkdown from 'react-markdown'

const NAV_ITEMS = [
    { id: 'technical', label: 'Technical Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>) },
    { id: 'behavioral', label: 'Behavioral Questions', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>) },
    { id: 'roadmap', label: 'Road Map', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>) },
]

// ==========================================
// Sub-components
// ==========================================
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(!open)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                </span>
            </div>
            {open && (
                <div className='q-card__body'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <div className="q-markdown-container text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            <ReactMarkdown>{item.intention}</ReactMarkdown>
                        </div>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <div className="q-markdown-container text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            <ReactMarkdown>{item.answer}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const RoadMapDay = ({ day }) => {
    return (
        <div className='roadmap-day'>
            <div className='roadmap-day__header'>
                <span className='roadmap-day__badge'>Day {day.day}</span>
                <h3 className='roadmap-day__focus'>{day.focus}</h3>
            </div>
            <ul className='roadmap-day__tasks'>
                {day.tasks.map((task, i) => (
                    <li key={i}>
                        <span className='roadmap-day__bullet' />
                        <span className="text-gray-600 text-sm block whitespace-pre-wrap leading-relaxed">
                            <ReactMarkdown>{task}</ReactMarkdown>
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ==========================================
// Main Component
// ==========================================
const Interview = () => {
    const [activeNav, setActiveNav] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()

    const navigate = useNavigate();

useEffect(() => {
    // 1. If we are on the temporary /new route, exit instantly and safely
    if (interviewId === 'new' || interviewId === '[object Object]') {
        return; // Safe exit! Do not fetch from backend, do not redirect home
    }

    // 2. Only fetch from the database if it's a real MongoDB record ID
    if (interviewId) {
        getReportById(interviewId);
    }
}, [interviewId]); // Only track changes to the route parameter

   // Clean and unified guard check to prevent crashes
const hasValidData = report && Object.keys(report).length > 0 && report.technicalQuestions;

if (loading || !hasValidData) {
    return (
        <main className="loading-screen">
            <h1 style={{ marginBottom: '10px' }}>Analyzing & Generating your Resume...</h1>
        </main>
    );
}

// Only runs when data is completely present in state
const scoreColor = report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low';

    
    return (
        <div className='interview-page'>
            <div className='interview-layout'>
                
                {/* Left Nav */}
                <nav className='interview-nav'>
                    <div className='interview-nav__content'>
                        <p className='interview-nav__label'>Sections</p>
                        {NAV_ITEMS.map(item => (
                            <button
                                key={item.id}
                                className={`interview-nav__item ${activeNav === item.id ? 'interview-nav__item--active' : ''}`}
                                onClick={() => setActiveNav(item.id)}
                            >
                                <span className='interview-nav__icon'>{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <button 
                    className='button primary-button' 

                   onClick={() => {
                   if (!report) {
                   alert("No report data available to download.");
                   return;
                  }

                  getResumePdf(report);
                  }}
                   >
  <svg height="0.8rem" style={{ marginRight: "0.8rem" }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  Download Resume
</button>
                </nav>

                <div className='interview-divider' />

                {/* Center Content */}
                <main className='interview-content'>
                    {activeNav === 'technical' && (
                        <section>
                            <div className='content-header'>
                                <h2>Technical Questions</h2>
                                <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.technicalQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'behavioral' && (
                        <section>
                            <div className='content-header'>
                                <h2>Behavioral Questions</h2>
                                <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                            </div>
                            <div className='q-list'>
                                {report.behavioralQuestions.map((q, i) => (
                                    <QuestionCard key={i} item={q} index={i} />
                                ))}
                            </div>
                        </section>
                    )}

                    {activeNav === 'roadmap' && (
                        <section>
                            <div className='content-header'>
                                <h2>Preparation Road Map</h2>
                                <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                            </div>
                            <div className='roadmap-list'>
                                {report.preparationPlan.map((day, i) => (
                                    <RoadMapDay key={i} day={day} />
                                ))}
                            </div>
                        </section>
                    )}
                </main>

                {/* Right Sidebar */}
                <aside className='interview-sidebar'>
                    {/* Match Score */}
                    <div className='match-score'>
                        <p className='match-score__label'>Match Score</p>
                        <div className={`match-score__ring ${scoreColor}`}>
                            <span className='match-score__value'>{report.matchScore}</span>
                            <span className='match-score__pct'>%</span>
                        </div>
                       <p className="match-score__sub">
  <strong>
    {report.matchScore >= 80 
      ? 'Strong match for this role' 
      : report.matchScore >= 60 
      ? 'Good match for this role' 
      : 'Potential match with skill gaps'}
  </strong>
</p>
                    </div>

                    <div className='sidebar-divider' />

                    {/* Skill Gaps */}
                    <div className='skill-gaps'>
                        <p className='skill-gaps__label'>Skill Gaps</p>
                        <div className='skill-gaps__list'>
                            {report.skillGaps.map((gap, i) => (
                                <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>
                                    {gap.skill}
                                </span>
                            ))}
                        </div>
                    </div>

                </aside>

            </div>
        </div>
    )
}

export default Interview;