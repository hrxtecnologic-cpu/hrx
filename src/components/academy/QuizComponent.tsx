'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Trophy } from 'lucide-react';
import type { QuizQuestion, QuizResult } from '@/types/academy';

interface QuizComponentProps {
  lessonId: string;
  enrollmentId: string;
  questions: QuizQuestion[];
  onComplete?: (result: QuizResult) => void;
  minimumScore?: number;
}

export function QuizComponent({
  lessonId,
  enrollmentId,
  questions,
  onComplete,
  minimumScore = 70,
}: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Verificar se todas as questões foram respondidas
    if (selectedAnswers.includes(-1)) {
      alert('Por favor, responda todas as questões antes de submeter!');
      return;
    }

    setSubmitting(true);

    try {
      // Formatar respostas para a API
      const answers = selectedAnswers.map((selected, index) => ({
        question_index: index,
        selected_option: selected,
      }));

      // Submeter quiz
      const res = await fetch(`/api/academy/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          answers,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setQuizResult(data.data);
        setShowResults(true);

        if (onComplete) {
          onComplete(data.data);
        }
      } else {
        alert(data.error || 'Erro ao submeter quiz');
      }
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      alert('Erro ao submeter quiz. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswers(Array(questions.length).fill(-1));
    setShowResults(false);
    setQuizResult(null);
  };

  // Mostrar resultados
  if (showResults && quizResult) {
    const passed = quizResult.score >= minimumScore;

    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {passed ? (
              <>
                <Trophy className="h-6 w-6 text-green-500" />
                <span>Parabéns! Você passou!</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <span>Quase lá! Continue estudando</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div className="text-center p-8 bg-zinc-800/50 rounded-lg">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-500' : 'text-yellow-500'}`}>
              {quizResult.score}%
            </div>
            <p className="text-zinc-400">
              Você acertou {quizResult.correct_answers} de {quizResult.total_questions} questões
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Nota mínima: {minimumScore}%
            </p>
          </div>

          {/* Detalhes das respostas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Revisão das Respostas</h3>
            {questions.map((question, idx) => {
              const answer = quizResult.answers[idx];
              const isCorrect = answer?.is_correct;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isCorrect ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white mb-2">
                        {idx + 1}. {question.question}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Sua resposta: <strong>{question.options[answer.selected_option]}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-400 mt-1">
                          Resposta correta: <strong>{question.options[question.correct]}</strong>
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-zinc-500 mt-2 italic">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {!passed && (
              <Button onClick={handleRetry} className="flex-1 bg-white text-black hover:bg-red-500 hover:text-white transition-colors">
                Tentar Novamente
              </Button>
            )}
            <Button
              onClick={() => {
                window.location.href = '/academia/meus-cursos';
              }}
              variant="outline"
              className="flex-1 text-white hover:bg-red-500 hover:border-red-500 hover:text-white"
            >
              Voltar aos Meus Cursos
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mostrar quiz
  const question = questions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];
  const answeredCount = selectedAnswers.filter((a) => a !== -1).length;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Quiz</CardTitle>
          <Badge variant="outline" className="text-zinc-400">
            Questão {currentQuestion + 1} de {questions.length}
          </Badge>
        </div>
        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-zinc-400 mb-2">
            <span>Progresso</span>
            <span>
              {answeredCount}/{questions.length} respondidas
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${(answeredCount / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            {currentQuestion + 1}. {question.question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswer === idx
                    ? 'border-blue-500 bg-blue-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-800/50 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === idx ? 'border-blue-500 bg-blue-500' : 'border-zinc-600'
                    }`}
                  >
                    {selectedAnswer === idx && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t border-zinc-800">
          <Button onClick={handlePrevious} disabled={currentQuestion === 0} variant="outline">
            Anterior
          </Button>

          <span className="text-sm text-zinc-400">
            {answeredCount === questions.length
              ? '✓ Todas respondidas'
              : `${questions.length - answeredCount} restantes`}
          </span>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting || answeredCount < questions.length}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? 'Enviando...' : 'Enviar Quiz'}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={selectedAnswer === -1} className="bg-white text-black hover:bg-red-500 hover:text-white transition-colors">
              Próxima
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
