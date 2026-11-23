"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  LuHash,
  LuUsers,
  LuSearch,
  LuPlus,
  LuTrash2,
  LuFilter,
  LuCircleCheck,
  LuExternalLink,
  LuSparkles,
  LuX,
  LuChevronRight
} from 'react-icons/lu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  StudentInfo,
  AggregatedProblemData,
  getAllStudentsCompletedProblems,
  getStudentSolvedProblemNumbers,
  addStudentSolvedProblemNumbers,
  removeStudentSolvedProblemNumber,
  fetchStudentsFromDB,
  getProblemDetails
} from '@/services/problemNumbers';

interface CompletedProblemsViewProps {
  currentStudentId: string;
}

export function CompletedProblemsView({ currentStudentId }: CompletedProblemsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'matrix'>('all');
  const [students, setStudents] = useState<StudentInfo[]>([]);

  // Search & Filter state for "All Students"
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedProblem, setSelectedProblem] = useState<AggregatedProblemData | null>(null);

  // My Solved state
  const [mySolvedNumbers, setMySolvedNumbers] = useState<number[]>([]);
  const [newProblemInput, setNewProblemInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const fetchedStudents = await fetchStudentsFromDB();
        if (!ignore) {
          setStudents(fetchedStudents);
          const mySolved = getStudentSolvedProblemNumbers(currentStudentId);
          setMySolvedNumbers(mySolved);
        }
      } catch (e) {
        console.error('Failed to load problem completions data', e);
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, [currentStudentId]);

  // Aggregate all completed problems across all students
  const aggregatedProblems = useMemo(() => {
    return getAllStudentsCompletedProblems(students);
  }, [students]);

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return aggregatedProblems.filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        p.problemNumber.toString() === q ||
        p.problemNumber.toString().includes(q) ||
        p.info.title.toLowerCase().includes(q) ||
        p.info.category.toLowerCase().includes(q);

      const matchDifficulty =
        difficultyFilter === 'All' || p.info.difficulty === difficultyFilter;

      return matchSearch && matchDifficulty;
    });
  }, [aggregatedProblems, searchQuery, difficultyFilter]);

  // Handle adding new problem numbers
  const handleAddProblemNumbers = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblemInput.trim()) return;

    // Parse comma or space separated problem numbers e.g. "10, 20, 42"
    const parsedNumbers = newProblemInput
      .split(/[\s,]+/)
      .map((str) => parseInt(str.trim(), 10))
      .filter((num) => !isNaN(num) && num > 0);

    if (parsedNumbers.length === 0) {
      toast.error('Please enter valid problem numbers (e.g. 10, 20, 121)');
      return;
    }

    setIsAdding(true);
    const updated = addStudentSolvedProblemNumbers(currentStudentId, parsedNumbers);
    setMySolvedNumbers(updated);
    setNewProblemInput('');
    setIsAdding(false);
    toast.success(`Added problem numbers: ${parsedNumbers.join(', ')}`);
  };

  // Handle removing a problem number
  const handleRemoveProblemNumber = (num: number) => {
    const updated = removeStudentSolvedProblemNumber(currentStudentId, num);
    setMySolvedNumbers(updated);
    toast.info(`Removed Problem #${num}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-surface border border-border-subtle p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <LuSparkles size={12} />
              Problem Registry
            </span>
            <span className="text-[10px] font-black text-muted uppercase tracking-wider">
              {aggregatedProblems.length} Problems Tracked
            </span>
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-black tracking-tight text-foreground">
            Completed <span className="text-primary">Problem Numbers</span>
          </h3>
          <p className="text-sm font-medium text-muted max-w-xl">
            Explore problem numbers (e.g. #10, #20, #42, #121) completed by all students across the batch.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1.5 bg-foreground/5 border border-border-subtle/60 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'all'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:text-foreground hover:bg-foreground/5'
            )}
          >
            <LuUsers size={14} />
            All Students ({aggregatedProblems.length})
          </button>

          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'my'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:text-foreground hover:bg-foreground/5'
            )}
          >
            <LuCircleCheck size={14} />
            My Solved ({mySolvedNumbers.length})
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer',
              activeTab === 'matrix'
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-muted hover:text-foreground hover:bg-foreground/5'
            )}
          >
            <LuHash size={14} />
            Matrix View
          </button>
        </div>
      </div>

      {/* TAB 1: ALL STUDENTS COMPLETED PROBLEMS */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-surface border border-border-subtle p-4 rounded-2xl">
            <div className="relative w-full sm:w-80">
              <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search problem # (e.g. 10, 20) or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-foreground/5 border border-border-subtle rounded-xl text-xs font-bold text-foreground placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <LuX size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <span className="text-[10px] font-black text-muted uppercase tracking-wider flex items-center gap-1 shrink-0">
                <LuFilter size={12} /> Difficulty:
              </span>
              {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficultyFilter(diff)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all shrink-0 cursor-pointer',
                    difficultyFilter === diff
                      ? diff === 'Easy'
                        ? 'bg-emerald-500 text-white'
                        : diff === 'Medium'
                        ? 'bg-amber-500 text-white'
                        : diff === 'Hard'
                        ? 'bg-red-500 text-white'
                        : 'bg-foreground text-background'
                      : 'bg-foreground/5 text-muted hover:text-foreground'
                  )}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Problem Number Pills Bar */}
          <div className="bg-surface/50 border border-border-subtle p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                <LuHash className="text-primary" size={14} /> Quick Problem Jump
              </span>
              <span className="text-[10px] font-bold text-muted">Click any number to filter</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
              {aggregatedProblems.map((p) => (
                <button
                  key={p.problemNumber}
                  onClick={() => setSearchQuery(p.problemNumber.toString())}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 border cursor-pointer',
                    searchQuery === p.problemNumber.toString()
                      ? 'bg-primary border-primary text-white scale-105 shadow-sm'
                      : 'bg-surface border-border-subtle text-foreground hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  <span className="text-[10px] text-muted font-normal">#</span>
                  {p.problemNumber}
                  <span className="text-[9px] px-1 rounded-full bg-foreground/10 font-bold ml-0.5">
                    {p.studentsCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Problem Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProblems.map((item) => (
              <div
                key={item.problemNumber}
                className="bg-surface border border-border-subtle hover:border-primary/30 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-sm font-black tracking-tight border border-primary/20">
                        #{item.problemNumber}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                          item.info.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : item.info.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        )}
                      >
                        {item.info.difficulty}
                      </span>
                    </div>

                    <a
                      href={item.info.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted hover:text-primary transition-colors p-1"
                      title="Open on LeetCode"
                    >
                      <LuExternalLink size={14} />
                    </a>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {item.info.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-muted tracking-wider uppercase">
                      {item.info.category}
                    </span>
                  </div>
                </div>

                {/* Student Count & Avatar Stack */}
                <div className="pt-3 border-t border-border-subtle/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {item.students.slice(0, 4).map((s, idx) => (
                        <div
                          key={s.id || idx}
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center uppercase shrink-0"
                          title={s.name}
                        >
                          {s.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {item.studentsCount} {item.studentsCount === 1 ? 'Student' : 'Students'}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedProblem(item)}
                    className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-primary/10 text-muted hover:text-primary text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    View List <LuChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}

            {filteredProblems.length === 0 && (
              <div className="col-span-full py-16 text-center bg-surface border border-border-subtle rounded-3xl space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-muted mx-auto">
                  <LuHash size={24} />
                </div>
                <h4 className="font-display font-bold text-lg text-foreground">No Matching Problem Numbers Found</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Try searching for a different problem number (e.g. 10, 20, 121) or clear filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDifficultyFilter('All');
                  }}
                  className="btn-primary py-2 px-4 text-xs font-black uppercase tracking-wider rounded-xl mt-2 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY SOLVED PROBLEMS */}
      {activeTab === 'my' && (
        <div className="space-y-6 max-w-4xl">
          {/* Add Problem Form */}
          <div className="bg-surface border border-border-subtle p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <LuPlus className="text-primary" size={18} />
              <h4 className="font-display text-lg font-bold text-foreground">Log Completed Problem Numbers</h4>
            </div>
            <p className="text-xs text-muted">
              Enter problem numbers you completed on LeetCode (e.g., enter single numbers like <code className="bg-foreground/10 px-1 rounded">10</code> or multiple numbers separated by commas like <code className="bg-foreground/10 px-1 rounded">10, 20, 42, 121</code>).
            </p>

            <form onSubmit={handleAddProblemNumbers} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter problem numbers (e.g., 10, 20, 42, 121)"
                value={newProblemInput}
                onChange={(e) => setNewProblemInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-foreground/5 border border-border-subtle rounded-2xl text-xs font-bold text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={isAdding || !newProblemInput.trim()}
                className={cn(
                  'btn-primary h-11 px-6 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0',
                  (!newProblemInput.trim() || isAdding) && 'opacity-50 cursor-not-allowed'
                )}
              >
                <LuPlus size={16} />
                Add Problem Numbers
              </button>
            </form>
          </div>

          {/* List of My Solved Problems */}
          <div className="bg-surface border border-border-subtle p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                <LuCircleCheck className="text-emerald-500" size={18} />
                Your Solved Problems List ({mySolvedNumbers.length})
              </h4>
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
                Click trash icon to remove
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {mySolvedNumbers.sort((a, b) => a - b).map((num) => {
                const details = getProblemDetails(num);
                return (
                  <div
                    key={num}
                    className="p-3.5 rounded-2xl bg-foreground/5 border border-border-subtle/80 flex items-center justify-between gap-3 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-1 rounded-xl bg-primary/10 text-primary font-black text-xs shrink-0">
                        #{num}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{details.title}</p>
                        <span className="text-[9px] font-semibold text-muted uppercase">
                          {details.difficulty}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveProblemNumber(num)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                      title="Remove problem number"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {mySolvedNumbers.length === 0 && (
              <div className="py-12 text-center text-muted space-y-2">
                <LuHash className="mx-auto" size={32} />
                <p className="text-xs font-bold">No problem numbers logged yet.</p>
                <p className="text-[11px]">Use the input box above to add problem numbers you have completed!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MATRIX VIEW */}
      {activeTab === 'matrix' && (
        <div className="bg-surface border border-border-subtle p-6 rounded-3xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-display text-xl font-bold text-foreground">Problem Completion Matrix</h4>
              <p className="text-xs font-medium text-muted">
                Quick grid of problem numbers #1 to #300+ with total student completion counts.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-primary/20 border border-primary/40"></span>
                Completed by You
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-md bg-emerald-500/20 border border-emerald-500/40"></span>
                Solved by Batch
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5">
            {aggregatedProblems.map((p) => {
              const isMine = mySolvedNumbers.includes(p.problemNumber);
              return (
                <button
                  key={p.problemNumber}
                  onClick={() => setSelectedProblem(p)}
                  className={cn(
                    'p-3 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer group hover:scale-105',
                    isMine
                      ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                      : 'bg-surface border-border-subtle hover:border-foreground/20 text-foreground'
                  )}
                >
                  <span className="text-[10px] font-semibold text-muted">#</span>
                  <span className="font-display font-black text-sm">{p.problemNumber}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/5 text-muted mt-1 group-hover:bg-primary/20 group-hover:text-primary">
                    {p.studentsCount} {p.studentsCount === 1 ? 'user' : 'users'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STUDENT LIST MODAL FOR SELECTED PROBLEM */}
      {selectedProblem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-border-subtle rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border-subtle bg-gradient-to-r from-primary/5 to-transparent flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-black text-xs border border-primary/20">
                    Problem #{selectedProblem.problemNumber}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider',
                      selectedProblem.info.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : selectedProblem.info.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-red-500/10 text-red-500'
                    )}
                  >
                    {selectedProblem.info.difficulty}
                  </span>
                </div>
                <h3 className="font-display text-xl font-black text-foreground">
                  {selectedProblem.info.title}
                </h3>
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Category: {selectedProblem.info.category}
                </p>
              </div>

              <button
                onClick={() => setSelectedProblem(null)}
                className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <LuX size={18} />
              </button>
            </div>

            {/* Modal Body: List of Students */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                  <LuUsers className="text-primary" size={14} />
                  Students Who Solved Problem #{selectedProblem.problemNumber}
                </span>
                <span className="text-xs font-bold text-foreground px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {selectedProblem.studentsCount} Students
                </span>
              </div>

              <div className="space-y-2.5">
                {selectedProblem.students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3.5 rounded-2xl bg-foreground/5 border border-border-subtle/70 flex items-center justify-between hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 text-primary text-xs font-black flex items-center justify-center uppercase shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{student.name}</p>
                        <p className="text-[10px] font-medium text-muted">
                          Reg No: {student.registerNumber} • Dept: {student.department}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <LuCircleCheck size={12} /> Solved
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border-subtle bg-surface flex items-center justify-between">
              <a
                href={selectedProblem.info.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1.5"
              >
                <LuExternalLink size={14} /> View Problem on LeetCode
              </a>
              <button
                onClick={() => setSelectedProblem(null)}
                className="px-5 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-xs font-bold text-foreground transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
