// 页面切换动画
export {};

export const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.98
  }
};

export const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.4
};

// 消息动画
export const messageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95
  }
};

export const messageTransition = {
  duration: 0.3,
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

// 房间列表动画
export const roomItemVariants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0
  },
  exit: {
    opacity: 0,
    x: 20
  }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

// 模态框动画
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20
  }
};

export const modalTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  duration: 0.3
};

// 背景遮罩动画
export const backdropVariants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

// 按钮动画
export const buttonHover = {
  scale: 1.02,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25
  }
};

export const buttonTap = {
  scale: 0.98
};

// 输入框聚焦动画
export const inputFocusVariants = {
  focused: {
    scale: 1.02,
    borderColor: "hsl(var(--ring))"
  },
  unfocused: {
    scale: 1,
    borderColor: "hsl(var(--border))"
  }
};

// 加载动画
export const loadingSpinner = {
  animate: {
    rotate: 360
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: "linear" as const
  }
};

// 脉冲动画
export const pulseAnimation = {
  animate: {
    scale: [1, 1.2, 1]
  },
  transition: {
    duration: 1,
    repeat: Infinity
  }
};

// 弹跳动画
export const bounceAnimation = {
  animate: {
    y: [0, -10, 0]
  },
  transition: {
    duration: 0.6,
    repeat: Infinity,
    ease: "easeInOut" as const
  }
};

// 淡入动画
export const fadeInVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0
  }
};

export const fadeInTransition = {
  duration: 0.5,
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

// 侧边栏滑入动画
export const slideInVariants = {
  initial: {
    x: "100%"
  },
  animate: {
    x: 0
  },
  exit: {
    x: "100%"
  }
};

export const slideTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

// 表情面板动画
export const emojiPanelVariants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 10
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 10
  }
};

// 表情项动画
export const emojiItemVariants = {
  initial: {
    opacity: 0,
    scale: 0
  },
  animate: {
    opacity: 1,
    scale: 1
  }
};

export const emojiItemTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 25
};

// 连接状态动画
export const connectionStatusVariants = {
  connected: {
    scale: [1, 1.2, 1],
    backgroundColor: "#10b981"
  },
  disconnected: {
    scale: 1,
    backgroundColor: "#ef4444"
  }
};

export const connectionStatusTransition = {
  scale: {
    duration: 1,
    repeat: Infinity
  },
  backgroundColor: {
    duration: 0.3
  }
}; 