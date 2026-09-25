export const DOMAIN_OPTIONS = ['Tech / IT', 'Management', 'Medical'] as const;
export type DomainType = typeof DOMAIN_OPTIONS[number];

export const DOMAIN_COURSES: Record<DomainType, string[]> = {
  'Tech / IT': [
    'Artificial Intelligence',
    'Full Stack Software Development',
    'Data Science',
    'Cyber Security',
    'DevOps',
    'UI/UX Design',
    'VLSI Design',
    'IoT & Robotics',
    'Data Structures & Algorithms',
    'Machine Learning',
    'Cloud Computing',
    'Data Analytics',
    'SQL',
    'Embedded Systems',
    'Android App Development',
    'AutoCAD',
  ],
  'Management': [
    'Digital Marketing',
    'HR',
    'Finance',
    'Business Analytics',
    'Stock Market',
    'Graphics Design',
  ],
  'Medical': [
    'Psychology',
    'Medical Coding',
  ],
};

export const ALL_COURSES: string[] = Object.values(DOMAIN_COURSES).flat();

export const DOMAIN_THEMES: Record<
  DomainType,
  {
    primary: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  'Tech / IT': {
    primary: '#4F46E5', // Indigo
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    badgeBorder: 'border-indigo-200 dark:border-indigo-800',
  },
  'Management': {
    primary: '#D97706', // Amber
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
  },
  'Medical': {
    primary: '#0D9488', // Teal
    badgeBg: 'bg-teal-50 dark:bg-teal-950/50',
    badgeText: 'text-teal-700 dark:text-teal-300',
    badgeBorder: 'border-teal-200 dark:border-teal-800',
  },
};

/**
 * Returns parent domain for a course name.
 */
export function getDomainForCourse(courseName: string): DomainType | undefined {
  if (!courseName) return undefined;
  const normalized = courseName.trim().toLowerCase();

  // Special aliases / backward compatibility mappings
  if (normalized.includes('full stack')) return 'Tech / IT';
  if (normalized.includes('data science') || normalized.includes('data analytics') || normalized.includes('machine learning') || normalized.includes('ai')) return 'Tech / IT';
  if (normalized.includes('cyber')) return 'Tech / IT';
  if (normalized.includes('marketing') || normalized.includes('finance') || normalized.includes('business')) return 'Management';
  if (normalized.includes('psychology') || normalized.includes('medical')) return 'Medical';

  for (const domain of DOMAIN_OPTIONS) {
    const matched = DOMAIN_COURSES[domain].find(
      (c) => c.toLowerCase() === normalized
    );
    if (matched) return domain;
  }
  return undefined;
}

/**
 * Normalizes and resolves Domain and Course from legacy or current data.
 * Always guarantees a valid Domain and Course.
 */
export function resolveDomainAndCourse(
  inputDomain?: string,
  inputCourse?: string,
  fallbackTrack?: string
): { domain: DomainType; course: string } {
  let domainCandidate = (inputDomain || '').trim();
  let courseCandidate = (inputCourse || '').trim();

  // If inputCourse is not provided but inputDomain looks like a Course name
  if (!courseCandidate && domainCandidate) {
    const parent = getDomainForCourse(domainCandidate);
    if (parent) {
      // domainCandidate was actually a course name (e.g. "Full Stack Development" or "Data Science")
      const matchedCanonical = DOMAIN_COURSES[parent].find(
        (c) => c.toLowerCase() === domainCandidate.toLowerCase()
      ) || (domainCandidate.toLowerCase().includes('full stack') ? 'Full Stack Software Development' : domainCandidate);

      return {
        domain: parent,
        course: matchedCanonical,
      };
    }
  }

  // If inputDomain is a valid domain
  if (DOMAIN_OPTIONS.includes(domainCandidate as DomainType)) {
    const validDomain = domainCandidate as DomainType;
    const courses = DOMAIN_COURSES[validDomain];

    if (courseCandidate) {
      const match = courses.find((c) => c.toLowerCase() === courseCandidate.toLowerCase());
      if (match) {
        return { domain: validDomain, course: match };
      }
      // Check if courseCandidate belongs to another domain
      const otherDomain = getDomainForCourse(courseCandidate);
      if (otherDomain) {
        const canonical = DOMAIN_COURSES[otherDomain].find((c) => c.toLowerCase() === courseCandidate.toLowerCase());
        return { domain: otherDomain, course: canonical || courseCandidate };
      }
    }

    // Default to the first course of this domain (or Full Stack Software Development for Tech/IT)
    return {
      domain: validDomain,
      course: validDomain === 'Tech / IT' ? 'Full Stack Software Development' : courses[0],
    };
  }

  // Check fallback track
  if (fallbackTrack) {
    const fromFallback = getDomainForCourse(fallbackTrack);
    if (fromFallback) {
      const canonical = DOMAIN_COURSES[fromFallback].find((c) => c.toLowerCase() === fallbackTrack.toLowerCase()) ||
        (fallbackTrack.toLowerCase().includes('full stack') ? 'Full Stack Software Development' : fallbackTrack);
      return {
        domain: fromFallback,
        course: canonical,
      };
    }
  }

  // Ultimate default fallback
  return {
    domain: 'Tech / IT',
    course: 'Full Stack Software Development',
  };
}

/**
 * Returns a consistent hex color for a course.
 */
export function getCourseColor(courseName: string, domainName?: string): string {
  const domain = (domainName as DomainType) || getDomainForCourse(courseName) || 'Tech / IT';
  return DOMAIN_THEMES[domain]?.primary || '#4F46E5';
}
