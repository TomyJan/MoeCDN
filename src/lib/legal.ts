import type { Language } from './types.ts';

export const policyVersion = '2026-10-30';
export type LegalPageKind = 'terms' | 'privacy';

export function legalPageKind(path: string | null): LegalPageKind | null {
  if (path === 'terms' || path === 'terms/') return 'terms';
  if (path === 'privacy' || path === 'privacy/') return 'privacy';
  return null;
}

interface LegalDocument {
  introduction: string;
  sections: { title: string; paragraphs: string[]; important?: boolean }[];
  contact: string;
  contactNote: string;
}

const zh: Record<LegalPageKind, LegalDocument> = {
  terms: {
    introduction:
      '本协议适用于您使用 MoeCDN 提供的资源浏览、检索、预览和访问服务。本站由 MoeCDN 运营者（TomyJan）维护。请在使用相关功能前阅读本协议。',
    sections: [
      {
        title: '服务范围',
        paragraphs: [
          '本站提供公共资源的访问便利。资源内容、版本和可用范围可能随实际情况更新，使用前请自行核对是否符合您的用途。',
        ],
      },
      {
        title: '合理使用',
        paragraphs: [
          '使用本站应遵守适用法律，尊重他人的知识产权、隐私及其他合法权益，不得将本站服务或资源用于违法、侵权活动。',
          '请合理使用公共服务。不得以恶意请求、滥用流量、破坏或绕过安全措施等方式，妨碍本站或其他用户的正常使用。',
        ],
      },
      {
        title: '资源与授权',
        paragraphs: [
          '本站程序与所载资源分别适用其声明的授权条件。资源的著作权及其他权利归相应权利人所有；本站提供访问不构成额外授权，也不改变原有许可。',
          '如您认为某项资源侵害您的合法权益，请提供相关资源位置及必要的权利说明。我们将核实并依法处理。',
        ],
      },
      {
        title: '服务调整',
        important: true,
        paragraphs: [
          '为维护安全、处理资源滥用或适应运营条件，本站可能合理调整资源、限制异常使用，或暂停、终止部分服务。在条件允许时，我们会提前提示重要调整。',
          '公共服务可能因维护、网络故障等原因中断，不能保证持续可用或满足所有特定用途。对重要用途，请保留所需资源的副本并做好适当安排。',
        ],
      },
      {
        title: '责任边界',
        important: true,
        paragraphs: [
          '我们会采取合理措施维护本站，并依法承担应承担的责任。请结合资源来源、授权条件和实际用途作出使用判断；第三方内容不代表本站的认可或承诺。',
          '本协议不排除或限制依法不得免除的责任，也不限制您依法享有的权利。部分条款无效的，不影响其余条款依法适用。',
        ],
      },
      {
        title: '协议更新',
        paragraphs: [
          '本协议可能随服务或相关规则的变化更新，页面将标明更新日期。涉及您的主要权利义务的变化，我们会作出显著提示，并依法取得必要的确认。',
          '未成年人请在监护人的指导下阅读本协议并使用本站。如有争议，您可先联系我们协商处理，这不影响您依法寻求其他救济。',
        ],
      },
    ],
    contact:
      '有关服务使用、资源授权或权益的问题，请通过项目仓库的 Issues 联系 MoeCDN 运营者（TomyJan）。',
    contactNote:
      'Issues 为公开页面，请勿直接发布身份证件、联系方式等敏感资料。确需补充资料时，我们会与您协商适当的提供方式。',
  },
  privacy: {
    introduction:
      'MoeCDN 运营者（TomyJan）尊重您的隐私。本政策说明您访问本站时涉及的信息处理，以及您可以如何联系我们并行使相关权利。',
    sections: [
      {
        title: '信息与用途',
        paragraphs: [
          '访问本站时，本站及提供运行支持的服务方可能处理网络地址、访问时间、页面与来源、设备和浏览器等基本访问信息，用于内容送达、安全维护、故障排查及使用情况分析。',
          '您主动联系我们时，我们会处理您提交的事项及联系信息，以便回应和处理请求。请勿提供与该事项无关的敏感信息。',
        ],
      },
      {
        title: 'Cookie 与本地记录',
        paragraphs: [
          '本站及相关服务方可能使用 Cookie 或类似方式维持正常运行、提供安全防护，并记住您的语言、外观及条款确认状态。',
          '您可通过浏览器设置管理或清除相关记录。清除后，本站可能恢复默认设置并再次提示确认；限制必要记录可能影响部分功能或偏好的保留。',
        ],
      },
      {
        title: '访问情况分析',
        paragraphs: [
          '本站会了解访问量、页面使用情况及一般访问特征，以评估和改进服务。相关访问信息可能在打开页面时产生。',
          '告知中的确认按钮用于记录您对用户协议和本政策的确认，不表示您对未说明的信息处理用途作出概括授权。',
        ],
      },
      {
        title: '服务方与对外提供',
        paragraphs: [
          '本站使用第三方提供的内容分发、安全防护等运行支持。相关服务方会在提供支持所需范围内处理访问信息，并适用其相应的隐私规则。',
          '我们不出售您的个人信息。如依法需要委托处理、对外提供或披露相关信息，我们将遵守适用要求，履行相应的告知、同意及保护义务。您访问外部链接时，相应网站的信息处理适用其自身规则。',
        ],
      },
      {
        title: '保留与保护',
        paragraphs: [
          '相关信息的保留以实现所述目的及履行法定义务所需为限；不再需要的信息将依法删除或作适当处理。我们会采取合理措施保护相关信息，减少未经授权的访问、泄露或损毁。',
        ],
      },
      {
        title: '您的权利',
        paragraphs: [
          '您可依法请求了解、查阅、更正或删除与您有关的信息，或就信息处理提出异议。对于依法以同意为依据的处理，您可申请撤回同意。我们会在核实必要情况后依法回应。',
          '请通过下方入口提出请求，并尽量说明所涉事项。我们只会要求处理请求所必要的信息，不会要求您公开无关的个人资料。',
        ],
      },
      {
        title: '政策更新',
        paragraphs: [
          '本政策更新时会标明日期。对影响您的重要变化，我们会通过显著方式提示，并在依法需要时另行告知或取得同意。',
          '未成年人请在监护人指导下阅读本政策。监护人如对相关信息处理有疑问，可通过下方入口联系我们。',
        ],
      },
    ],
    contact:
      '隐私疑问、信息处理请求或权益投诉，请通过项目仓库的 Issues 联系 MoeCDN 运营者（TomyJan）。',
    contactNote:
      'Issues 为公开页面，请勿直接发布身份证件、联系方式等敏感资料。确需补充资料时，我们会与您协商适当的提供方式。',
  },
};

const en: Record<LegalPageKind, LegalDocument> = {
  terms: {
    introduction:
      'These terms apply to browsing, searching, previewing and accessing resources on MoeCDN, maintained by the MoeCDN operator (TomyJan). Please read them before using the relevant features.',
    sections: [
      {
        title: 'Our service',
        paragraphs: [
          'MoeCDN provides convenient access to public resources. Content, versions and availability may change. Please check whether a resource is suitable for your intended use.',
        ],
      },
      {
        title: 'Responsible use',
        paragraphs: [
          'Follow applicable law and respect intellectual property, privacy and other lawful rights. Do not use this service or its resources for unlawful or infringing activities.',
          'Use this public service reasonably. Do not disrupt it or other visitors through malicious requests, traffic abuse, damage or circumvention of security measures.',
        ],
      },
      {
        title: 'Resources and permissions',
        paragraphs: [
          'The site software and hosted resources are subject to their respective licences. Rights remain with their holders. Providing access does not grant additional permissions or change an existing licence.',
          'If you believe a resource infringes your rights, please identify its location and provide the necessary explanation of your rights. We will review the matter and respond as required by law.',
        ],
      },
      {
        title: 'Service changes',
        important: true,
        paragraphs: [
          'To maintain security, address abuse or respond to operating conditions, we may reasonably change resources, restrict abnormal use, or suspend or discontinue parts of the service. Where practicable, we will give advance notice of significant changes.',
          'Maintenance, network failures and other circumstances can interrupt this public service. Continuous availability or suitability for every particular purpose cannot be guaranteed. Keep copies of resources needed for important uses and make appropriate arrangements.',
        ],
      },
      {
        title: 'Responsibility',
        important: true,
        paragraphs: [
          'We take reasonable steps to maintain the service and remain responsible where required by law. Consider a resource’s source, permissions and suitability before using it. Third-party content does not constitute our endorsement or promise.',
          'These terms do not exclude or limit liability that cannot lawfully be excluded, or restrict your statutory rights. If a provision is invalid, the remaining provisions continue to apply to the extent permitted by law.',
        ],
      },
      {
        title: 'Updates to these terms',
        paragraphs: [
          'We may update these terms as the service or applicable rules change. This page shows the update date. We will prominently notify you of changes affecting your main rights or obligations and obtain confirmation where required.',
          'Minors should read these terms and use the site with guidance from a guardian. You may contact us to discuss a dispute; this does not prevent you from seeking other remedies available by law.',
        ],
      },
    ],
    contact:
      'For service, licensing or rights enquiries, contact the MoeCDN operator (TomyJan) through Issues in the project repository.',
    contactNote:
      'Issues are public. Do not post identity documents, contact details or other sensitive information. If further information is necessary, we will discuss an appropriate way to provide it.',
  },
  privacy: {
    introduction:
      'The MoeCDN operator (TomyJan) respects your privacy. This policy explains information processing when you visit the site and how to contact us or exercise your rights.',
    sections: [
      {
        title: 'Information and purposes',
        paragraphs: [
          'The site and its service providers may process basic visit information, such as network address, visit time, pages and referrers, device and browser information, to deliver content, maintain security, resolve problems and understand service usage.',
          'When you contact us, we process the enquiry and contact information you provide to respond and handle your request. Please do not provide unrelated sensitive information.',
        ],
      },
      {
        title: 'Cookies and local records',
        paragraphs: [
          'The site and its service providers may use cookies or similar means to operate the service, provide security protection and remember your language, appearance and acknowledgement of these documents.',
          'You can manage or clear these records through your browser settings. Clearing them may restore defaults and show the notice again. Restricting necessary records may affect some features or the retention of preferences.',
        ],
      },
      {
        title: 'Understanding visits',
        paragraphs: [
          'We review visit counts, page usage and general visit characteristics to assess and improve the service. Relevant visit information may be generated when a page is opened.',
          'The notice button records your acknowledgement of the terms and this policy. It does not grant blanket permission for information processing for undisclosed purposes.',
        ],
      },
      {
        title: 'Service providers and disclosures',
        paragraphs: [
          'Third parties support content delivery, security and other site operations. They process visit information as needed to provide that support, subject to their applicable privacy rules.',
          'We do not sell your personal information. Where information must lawfully be entrusted, provided or disclosed, we follow applicable notice, consent and protection requirements. External websites have their own information practices.',
        ],
      },
      {
        title: 'Retention and protection',
        paragraphs: [
          'Information is retained only as needed for the purposes described and legal obligations. Information no longer needed will be deleted or otherwise appropriately handled as required by law. We take reasonable steps to protect it against unauthorised access, disclosure or damage.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          'As provided by applicable law, you may request information about, access to, correction or deletion of information relating to you, or object to its processing. Where processing legally relies on consent, you may request withdrawal. We will respond after verifying what is necessary.',
          'Use the contact link below and describe your request where possible. We will request only information needed to handle it, and will not ask you to publish unrelated personal information.',
        ],
      },
      {
        title: 'Policy updates',
        paragraphs: [
          'We show the date when this policy is updated. We will prominently notify you of important changes and provide additional notice or obtain consent where required by law.',
          'Minors should read this policy with guidance from a guardian. Guardians with questions about information processing may contact us below.',
        ],
      },
    ],
    contact:
      'For privacy enquiries, information requests or rights complaints, contact the MoeCDN operator (TomyJan) through Issues in the project repository.',
    contactNote:
      'Issues are public. Do not post identity documents, contact details or other sensitive information. If further information is necessary, we will discuss an appropriate way to provide it.',
  },
};

export function legalDocument(
  kind: LegalPageKind,
  lang: Language,
): LegalDocument {
  return (lang === 'en' ? en : zh)[kind];
}
