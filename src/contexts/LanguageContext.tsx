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
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.new': 'New',
    'common.remove': 'Remove',
    'common.update': 'Update',
    'common.actions': 'Actions',
    'common.view': 'View',
    'common.select': 'Select',
    
    // Job Management
    'jobs.title': 'Job Management',
    'jobs.create': 'Create New Job',
    'jobs.edit': 'Edit Job',
    'jobs.new': 'New Job Booking',
    'jobs.number': 'Job Number',
    'jobs.customer': 'Customer',
    'jobs.machine': 'Machine',
    'jobs.status': 'Status',
    'jobs.notes': 'Notes',
    'jobs.print.label': 'Print Label',
    'jobs.print.invoice': 'Print Invoice',
    'jobs.saving': 'Saving...',
    'jobs.save': 'Save Job',
    'jobs.update.details': 'Update job details',
    'jobs.create.service': 'Create a new service booking',
    
    // Customer Information
    'customer.info': 'Customer Information',
    'customer.name': 'Customer Name',
    'customer.phone': 'Phone Number',
    'customer.address': 'Address',
    'customer.email': 'Email',
    'customer.notes': 'Customer Notes',
    'customer.required': 'required',
    
    // Machine Information
    'machine.info': 'Machine Information',
    'machine.category': 'Machine Category',
    'machine.brand': 'Brand',
    'machine.model': 'Model',
    'machine.serial': 'Serial Number',
    
    // Problem & Service
    'problem.title': 'Problem Description',
    'problem.description': 'Problem Description',
    'problem.additional': 'Additional Notes',
    'problem.quick': 'Quick Problem Descriptions',
    'problem.quick.help': 'Click to add to problem description above',
    'service.performed': 'Service Performed',
    'service.performed.by': 'Service Performed (by mechanic)',
    'service.recommendations': 'Recommendations / Future Attention',
    'service.deposit': 'Service Deposit',
    'service.notes': 'Mechanic Service Notes',
    
    // Quotation
    'quotation.title': 'Quotation',
    'quotation.amount': 'Quotation Amount',
    'quotation.notice': 'Important Notice:',
    'quotation.notice.text': 'Quotation cost is non-refundable. It may only be deducted from the total repair cost when the job is finalized.',
    
    // Parts
    'parts.title': 'Parts Management',
    'parts.required': 'Parts Required',
    'parts.name': 'Part Name',
    'parts.sku': 'SKU',
    'parts.price': 'Price',
    'parts.cost': 'Cost',
    'parts.unitPrice': 'Unit Price',
    'parts.totalPrice': 'Total Price',
    'parts.stock': 'Stock',
    'parts.category': 'Category',
    'parts.brand': 'Brand',
    'parts.quantity': 'Quantity',
    'parts.add': 'Add Part',
    'parts.custom': 'Custom Part',
    'parts.none': 'No parts added yet. Click "Add Part" to get started.',
    'parts.filter': 'Filter by category',
    'parts.all': 'All Categories',
    
    // Labour
    'labour.hours': 'Labour Hours',
    'labour.rate': 'Labour Rate',
    'labour.total': 'Labour Total',
    
    // Calculations
    'calc.subtotal': 'Subtotal',
    'calc.gst': 'GST (10%)',
    'calc.total': 'Grand Total',
    'calc.deposit': 'Service Deposit',
    'calc.final': 'Final Total',
    'calc.parts': 'Parts Subtotal',
    
    // Status
    'status.pending': 'Pending',
    'status.in-progress': 'In Progress',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'status.awaiting-parts': 'Awaiting Parts',
    'status.ready': 'Ready for Pickup',
    'status.change': 'Change Status',
    
    // Validation & Messages
    'msg.success': 'Success',
    'msg.error': 'Error',
    'msg.saved': 'Saved successfully',
    'msg.deleted': 'Deleted successfully',
    'msg.validation': 'Validation Error',
    'msg.validation.required': 'Please fill in all required fields',
    'msg.job.created': 'Job created successfully',
    'msg.job.updated': 'Job updated successfully',
    'msg.job.failed': 'Failed to save job',
    
    // Placeholders
    'placeholder.customer.name': 'Enter customer name',
    'placeholder.customer.phone': 'Enter phone number',
    'placeholder.customer.address': 'Enter customer address',
    'placeholder.customer.email': 'Enter email address',
    'placeholder.machine.serial': 'Enter serial number',
    'placeholder.problem': 'Describe the problem or service required',
    'placeholder.notes': 'Any additional notes or special instructions',
    'placeholder.service': 'e.g., Changed oil, replaced spark plug, sharpened blade, tuned carburettor...',
    'placeholder.recommendations': 'e.g., Rear belt worn—replace within 3 months; check air filter monthly...',
    'placeholder.part.name': 'Enter part name',
    'placeholder.quotation': 'Enter quotation amount',
    'placeholder.select': 'Select',
    'placeholder.select.part': 'Select part',
    
    // Auth
    'auth.login': 'Login',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullname': 'Full Name',
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
    'common.filter': '筛选',
    'common.all': '全部',
    'common.new': '新建',
    'common.remove': '删除',
    'common.update': '更新',
    'common.actions': '操作',
    'common.view': '查看',
    'common.select': '选择',
    
    // Job Management
    'jobs.title': '工作管理',
    'jobs.create': '创建新工作',
    'jobs.edit': '编辑工作',
    'jobs.new': '新工作预订',
    'jobs.number': '工作编号',
    'jobs.customer': '客户',
    'jobs.machine': '机器',
    'jobs.status': '状态',
    'jobs.notes': '备注',
    'jobs.print.label': '打印标签',
    'jobs.print.invoice': '打印发票',
    'jobs.saving': '保存中...',
    'jobs.save': '保存工作',
    'jobs.update.details': '更新工作详情',
    'jobs.create.service': '创建新服务预订',
    
    // Customer Information
    'customer.info': '客户信息',
    'customer.name': '客户姓名',
    'customer.phone': '电话号码',
    'customer.address': '地址',
    'customer.email': '电子邮箱',
    'customer.notes': '客户备注',
    'customer.required': '必填',
    
    // Machine Information
    'machine.info': '机器信息',
    'machine.category': '机器类别',
    'machine.brand': '品牌',
    'machine.model': '型号',
    'machine.serial': '序列号',
    
    // Problem & Service
    'problem.title': '问题描述',
    'problem.description': '问题描述',
    'problem.additional': '附加备注',
    'problem.quick': '快速问题描述',
    'problem.quick.help': '点击添加到上方问题描述',
    'service.performed': '已执行服务',
    'service.performed.by': '已执行服务（由技工）',
    'service.recommendations': '建议/未来注意事项',
    'service.deposit': '服务押金',
    'service.notes': '技工服务备注',
    
    // Quotation
    'quotation.title': '报价',
    'quotation.amount': '报价金额',
    'quotation.notice': '重要提示：',
    'quotation.notice.text': '报价费用不可退还。仅在工作完成时可从总维修费用中扣除。',
    
    // Parts
    'parts.title': '配件管理',
    'parts.required': '所需配件',
    'parts.name': '配件名称',
    'parts.sku': 'SKU',
    'parts.price': '价格',
    'parts.cost': '成本',
    'parts.unitPrice': '单价',
    'parts.totalPrice': '总价',
    'parts.stock': '库存',
    'parts.category': '类别',
    'parts.brand': '品牌',
    'parts.quantity': '数量',
    'parts.add': '添加配件',
    'parts.custom': '自定义配件',
    'parts.none': '尚未添加配件。点击"添加配件"开始。',
    'parts.filter': '按类别筛选',
    'parts.all': '所有类别',
    
    // Labour
    'labour.hours': '工时',
    'labour.rate': '工时费率',
    'labour.total': '工时总计',
    
    // Calculations
    'calc.subtotal': '小计',
    'calc.gst': 'GST (10%)',
    'calc.total': '总计',
    'calc.deposit': '服务押金',
    'calc.final': '最终总计',
    'calc.parts': '配件小计',
    
    // Status
    'status.pending': '待处理',
    'status.in-progress': '进行中',
    'status.completed': '已完成',
    'status.cancelled': '已取消',
    'status.awaiting-parts': '等待配件',
    'status.ready': '准备取货',
    'status.change': '更改状态',
    
    // Validation & Messages
    'msg.success': '成功',
    'msg.error': '错误',
    'msg.saved': '保存成功',
    'msg.deleted': '删除成功',
    'msg.validation': '验证错误',
    'msg.validation.required': '请填写所有必填字段',
    'msg.job.created': '工作创建成功',
    'msg.job.updated': '工作更新成功',
    'msg.job.failed': '保存工作失败',
    
    // Placeholders
    'placeholder.customer.name': '输入客户姓名',
    'placeholder.customer.phone': '输入电话号码',
    'placeholder.customer.address': '输入客户地址',
    'placeholder.customer.email': '输入电子邮箱',
    'placeholder.machine.serial': '输入序列号',
    'placeholder.problem': '描述问题或所需服务',
    'placeholder.notes': '任何附加备注或特殊说明',
    'placeholder.service': '例如：更换机油、更换火花塞、磨刀片、调整化油器...',
    'placeholder.recommendations': '例如：后皮带磨损-3个月内更换；每月检查空气过滤器...',
    'placeholder.part.name': '输入配件名称',
    'placeholder.quotation': '输入报价金额',
    'placeholder.select': '选择',
    'placeholder.select.part': '选择配件',
    
    // Auth
    'auth.login': '登录',
    'auth.signup': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.fullname': '全名',
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
