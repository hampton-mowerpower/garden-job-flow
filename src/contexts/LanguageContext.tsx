import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.jobs': 'Job Management',
    'nav.parts': 'Parts Catalogue',
    'nav.machines': 'Machine Management',
    'nav.reports': 'Reports',
    'nav.settings': 'Admin Settings',
    'nav.logout': 'Logout',
    
    // Common
    'common.search': 'Search',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Job Management
    'jobs.title': 'Job Management',
    'jobs.create': 'Create New Job',
    'jobs.customer': 'Customer',
    'jobs.machine': 'Machine',
    'jobs.status': 'Status',
    'jobs.notes': 'Notes',
    'jobs.print.label': 'Print Label',
    'jobs.print.invoice': 'Print Invoice',
    
    // Parts
    'parts.title': 'Parts Management',
    'parts.name': 'Name',
    'parts.sku': 'SKU',
    'parts.price': 'Price',
    'parts.cost': 'Cost',
    'parts.stock': 'Stock',
    'parts.category': 'Category',
    'parts.brand': 'Brand',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullname': 'Full Name',
    
    // Messages
    'msg.success': 'Success',
    'msg.error': 'Error',
    'msg.saved': 'Saved successfully',
    'msg.deleted': 'Deleted successfully',
  },
  zh: {
    // Navigation
    'nav.jobs': '工作管理',
    'nav.parts': '配件目录',
    'nav.machines': '机器管理',
    'nav.reports': '报告',
    'nav.settings': '管理设置',
    'nav.logout': '登出',
    
    // Common
    'common.search': '搜索',
    'common.add': '添加',
    'common.edit': '编辑',
    'common.delete': '删除',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.loading': '加载中...',
    'common.submit': '提交',
    'common.close': '关闭',
    'common.back': '返回',
    'common.next': '下一个',
    'common.previous': '上一个',
    
    // Job Management
    'jobs.title': '工作管理',
    'jobs.create': '创建新工作',
    'jobs.customer': '客户',
    'jobs.machine': '机器',
    'jobs.status': '状态',
    'jobs.notes': '备注',
    'jobs.print.label': '打印标签',
    'jobs.print.invoice': '打印发票',
    
    // Parts
    'parts.title': '配件管理',
    'parts.name': '名称',
    'parts.sku': 'SKU',
    'parts.price': '价格',
    'parts.cost': '成本',
    'parts.stock': '库存',
    'parts.category': '类别',
    'parts.brand': '品牌',
    
    // Auth
    'auth.login': '登录',
    'auth.signup': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.fullname': '全名',
    
    // Messages
    'msg.success': '成功',
    'msg.error': '错误',
    'msg.saved': '保存成功',
    'msg.deleted': '删除成功',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    return (stored as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
