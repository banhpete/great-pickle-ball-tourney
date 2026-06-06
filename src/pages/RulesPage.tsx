import rulesImg from '../assets/rules.png'
import './RulesPage.css'

export default function RulesPage() {
  return (
    <div className="rules-page">
      <img src={rulesImg} alt="Tournament rules" />
      <div className="rules-video">
        <iframe
          src="https://www.youtube.com/embed/fTvPYdKZqO0"
          title="Rules video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
