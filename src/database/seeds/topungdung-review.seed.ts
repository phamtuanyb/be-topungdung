/**
 * Seed nội dung review mẫu cho 3 ứng dụng: ChatGPT, CapCut, Canva.
 *
 *   npm run seed:review
 *
 * Mục đích: có sẵn 3 bài đầy đủ mọi khối để đối chiếu khi soạn các app còn lại
 * trong /admin/ung-dung.
 *
 * ⚠️  GIÁ VÀ THÔNG SỐ CHỈ LÀ MẪU — phải kiểm chứng lại trước khi xuất bản.
 * ⚠️  Ảnh dùng tạm file có sẵn trong /uploads, hãy thay bằng ảnh chụp thật.
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'news_db',
  synchronize: false,
});

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3001';
const img = (f: string) => `${PUBLIC_URL}/uploads/${f}`;

const SHOT_A = img('031cabef-9fa3-4b09-b359-d6801250250e.webp');
const SHOT_B = img('52d43c12-8a5c-4748-bb81-8e000bc28bca.webp');
const SHOT_C = img('ac924e39-df35-4c88-ad61-2673a42a9943.webp');

interface ReviewSeed {
  slug: string;
  content: string;
  app: Record<string, unknown>;
}

const REVIEWS: ReviewSeed[] = [
  // ─── ChatGPT ───────────────────────────────────────────────────────────────
  {
    slug: 'chatgpt',
    content: `
<h2>ChatGPT là gì?</h2>
<p>ChatGPT là trợ lý AI của OpenAI, hoạt động theo dạng hội thoại. Bạn mô tả việc cần làm bằng tiếng Việt bình thường, công cụ trả về kết quả: một đoạn nội dung, một bảng phân tích, một đoạn mã, hay một kế hoạch từng bước.</p>
<p>Điểm khiến ChatGPT phổ biến không nằm ở một tính năng riêng lẻ, mà ở chỗ nó thay thế được nhiều công cụ rời rạc: viết nháp, tóm tắt tài liệu, dịch, brainstorm ý tưởng, xử lý bảng tính, viết công thức Excel.</p>

<h2>Dùng được việc gì trong công việc hằng ngày</h2>
<ul>
  <li><b>Viết và biên tập:</b> nháp bài đăng, email khách hàng, mô tả sản phẩm, kịch bản video ngắn.</li>
  <li><b>Xử lý tài liệu:</b> tải lên file PDF hoặc Excel rồi hỏi trực tiếp về nội dung bên trong.</li>
  <li><b>Phân tích số liệu:</b> đọc file bán hàng, tự vẽ biểu đồ và chỉ ra xu hướng.</li>
  <li><b>Lập trình:</b> viết, giải thích và sửa lỗi mã nguồn — kể cả khi bạn không phải lập trình viên.</li>
</ul>

<h2>Chất lượng tiếng Việt</h2>
<p>Đây là điểm ChatGPT vượt lên so với phần lớn công cụ AI khác tại thị trường Việt Nam. Văn phong tiếng Việt tự nhiên, ít lỗi ngữ pháp, và quan trọng hơn là hiểu được các cách diễn đạt đời thường thay vì đòi hỏi câu lệnh máy móc.</p>
<p>Tuy vậy, với nội dung mang tính chuyên ngành hẹp — luật, y tế, kế toán Việt Nam — vẫn cần người có chuyên môn đọc lại. Công cụ có thể trình bày rất trôi chảy một thông tin sai.</p>

<h2>Có nên trả phí không?</h2>
<p>Bản miễn phí đủ cho nhu cầu thỉnh thoảng. Nếu bạn dùng hằng ngày cho công việc, bản trả phí đáng tiền ở ba điểm: mô hình mạnh hơn, tốc độ phản hồi ổn định vào giờ cao điểm, và quyền dùng các tính năng nâng cao như phân tích file lớn hay tạo ảnh.</p>
`.trim(),
    app: {
      tagline: 'Trợ lý AI đa năng nhất hiện nay, mạnh nhất ở khoản viết và phân tích tài liệu.',
      website: 'https://chatgpt.com',
      ctaText: 'Dùng thử miễn phí',
      developer: 'OpenAI',
      platforms: ['Web', 'Windows', 'macOS', 'iOS', 'Android'],
      pricingSummary: 'Miễn phí · Bản Plus có phí theo tháng',
      languages: 'Tiếng Việt, English và hơn 50 ngôn ngữ khác',
      shots: [
        { url: SHOT_A, caption: 'Giao diện hội thoại chính — nhập yêu cầu bằng tiếng Việt bình thường.' },
        { url: SHOT_B, caption: 'Tải file lên và hỏi trực tiếp về nội dung bên trong.' },
        { url: SHOT_C, caption: 'Phân tích dữ liệu và tự vẽ biểu đồ từ file Excel.' },
      ],
      scoreBreakdown: [
        { label: 'Chất lượng đầu ra', value: 9.7 },
        { label: 'Tiếng Việt', value: 9.5 },
        { label: 'Dễ sử dụng', value: 9.8 },
        { label: 'Giá trị so với chi phí', value: 9.2 },
        { label: 'Tích hợp & mở rộng', value: 9.4 },
      ],
      pros: [
        'Tiếng Việt tự nhiên, hiếm khi lỗi ngữ pháp',
        'Đọc và phân tích được file PDF, Excel, ảnh',
        'Bản miễn phí đã dùng được cho phần lớn việc thường ngày',
        'Có ứng dụng cho cả máy tính lẫn điện thoại',
        'Hệ sinh thái GPTs và API rất rộng',
      ],
      cons: [
        'Có thể trình bày trôi chảy một thông tin sai — luôn phải kiểm chứng',
        'Bản miễn phí bị giới hạn vào giờ cao điểm',
        'Thanh toán cần thẻ quốc tế',
        'Không nên đưa dữ liệu nhạy cảm của doanh nghiệp vào',
      ],
      bestFor: [
        'Người làm nội dung',
        'Nhân viên văn phòng',
        'Chủ doanh nghiệp nhỏ',
        'Lập trình viên',
        'Sinh viên',
      ],
      plans: [
        {
          name: 'Free',
          price: '0đ',
          period: 'miễn phí vĩnh viễn',
          features: ['Mô hình tiêu chuẩn', 'Số lượt hỏi giới hạn giờ cao điểm', 'Ứng dụng web và di động'],
        },
        {
          name: 'Plus',
          price: '~20$',
          period: '/ tháng',
          featured: true,
          features: [
            'Mô hình mạnh nhất',
            'Ưu tiên vào giờ cao điểm',
            'Phân tích file và tạo ảnh',
            'Tạo GPTs riêng',
          ],
        },
        {
          name: 'Business',
          price: 'Liên hệ',
          period: '/ người / tháng',
          features: ['Quản lý theo nhóm', 'Không dùng dữ liệu để huấn luyện', 'Bảng điều khiển quản trị'],
        },
      ],
      faq: [
        {
          q: 'ChatGPT có dùng miễn phí được không?',
          a: 'Có. Bản miễn phí đủ cho nhu cầu viết lách và hỏi đáp thông thường, chỉ bị giới hạn số lượt vào giờ cao điểm và không có các tính năng nâng cao.',
        },
        {
          q: 'ChatGPT viết tiếng Việt có tốt không?',
          a: 'Tốt. Đây là một trong những công cụ AI viết tiếng Việt tự nhiên nhất hiện nay. Với nội dung chuyên ngành hẹp thì vẫn cần người có chuyên môn đọc lại.',
        },
        {
          q: 'Có an toàn khi đưa dữ liệu công ty vào không?',
          a: 'Không nên đưa dữ liệu nhạy cảm vào bản miễn phí. Nếu bắt buộc phải xử lý dữ liệu nội bộ, hãy dùng gói Business hoặc API với cam kết không dùng dữ liệu để huấn luyện.',
        },
        {
          q: 'Thanh toán ở Việt Nam thế nào?',
          a: 'Cần thẻ tín dụng hoặc thẻ ghi nợ quốc tế. Một số ngân hàng trong nước có phát hành thẻ ảo dùng được.',
        },
      ],
      verdict:
        'Nếu chỉ được chọn một công cụ AI duy nhất để dùng cho công việc, ChatGPT vẫn là lựa chọn an toàn nhất ở thời điểm hiện tại. Bản miễn phí đủ để bắt đầu; chỉ nâng cấp khi bạn thấy mình chạm giới hạn mỗi ngày.',
    },
  },

  // ─── CapCut ────────────────────────────────────────────────────────────────
  {
    slug: 'capcut',
    content: `
<h2>CapCut hợp với ai?</h2>
<p>CapCut sinh ra cho video ngắn. Nếu công việc của bạn là ra đều video TikTok, Reels hay Shorts thì đây là công cụ có tỉ lệ "thời gian bỏ ra / kết quả thu về" tốt nhất hiện nay.</p>
<p>Ngược lại, nếu bạn dựng phim dài, cần chỉnh màu sâu hoặc làm việc theo quy trình hậu kỳ chuyên nghiệp, CapCut sẽ nhanh chóng chật chội.</p>

<h2>Những thứ tiết kiệm nhiều thời gian nhất</h2>
<ul>
  <li><b>Tự động tạo phụ đề:</b> nhận diện tiếng Việt khá chính xác, chỉ cần sửa lại vài từ.</li>
  <li><b>Kho template:</b> chọn mẫu, thay clip của mình vào là xong một video.</li>
  <li><b>Xoá phông không cần phông xanh:</b> đủ dùng cho video người nói.</li>
  <li><b>Kho nhạc và hiệu ứng:</b> gắn sẵn xu hướng đang chạy trên TikTok.</li>
</ul>

<h2>Điểm cần cân nhắc</h2>
<p>Nhiều hiệu ứng và mẫu đẹp nằm sau bản trả phí. Ngoài ra, do template được dùng chung rất rộng, video dễ bị "na ná" nhau nếu bạn không thay đổi gì thêm.</p>
<p>Vấn đề đáng lưu ý hơn với doanh nghiệp là điều khoản sử dụng và bản quyền nhạc khi dùng cho mục đích thương mại — nên đọc kỹ trước khi dùng cho quảng cáo trả tiền.</p>
`.trim(),
    app: {
      tagline: 'Công cụ dựng video ngắn nhanh nhất cho người không chuyên.',
      website: 'https://www.capcut.com',
      ctaText: 'Tải CapCut',
      developer: 'ByteDance',
      platforms: ['Windows', 'macOS', 'Web', 'iOS', 'Android'],
      pricingSummary: 'Miễn phí · Bản Pro có phí theo tháng',
      languages: 'Tiếng Việt, English',
      shots: [
        { url: SHOT_B, caption: 'Giao diện dựng phim với timeline nhiều lớp.' },
        { url: SHOT_C, caption: 'Tự động tạo phụ đề tiếng Việt từ giọng nói.' },
      ],
      scoreBreakdown: [
        { label: 'Dễ sử dụng', value: 9.6 },
        { label: 'Tốc độ dựng', value: 9.5 },
        { label: 'Tính năng AI', value: 9.0 },
        { label: 'Giá trị so với chi phí', value: 9.2 },
        { label: 'Phù hợp chuyên nghiệp', value: 7.4 },
      ],
      pros: [
        'Học được trong vòng một buổi',
        'Phụ đề tiếng Việt tự động, độ chính xác cao',
        'Kho template bám sát xu hướng',
        'Đồng bộ giữa điện thoại và máy tính',
        'Bản miễn phí không đóng dấu chìm',
      ],
      cons: [
        'Nhiều hiệu ứng đẹp nằm ở bản trả phí',
        'Video dễ giống nhau nếu lạm dụng template',
        'Không đủ cho hậu kỳ chuyên nghiệp',
        'Cần đọc kỹ bản quyền nhạc khi dùng thương mại',
      ],
      bestFor: ['Creator TikTok / Reels', 'Nhân viên marketing', 'Chủ shop bán hàng online', 'Người mới dựng video'],
      plans: [
        {
          name: 'Free',
          price: '0đ',
          period: 'miễn phí',
          features: ['Dựng và xuất video không dấu chìm', 'Phụ đề tự động', 'Kho template cơ bản'],
        },
        {
          name: 'Pro',
          price: '~8$',
          period: '/ tháng',
          featured: true,
          features: ['Toàn bộ hiệu ứng và template', 'Xuất chất lượng cao hơn', 'Kho lưu trữ đám mây', 'Công cụ AI nâng cao'],
        },
      ],
      faq: [
        {
          q: 'CapCut miễn phí có bị đóng dấu chìm không?',
          a: 'Không. Video xuất ra từ bản miễn phí không có dấu chìm, trừ khi bạn dùng một số template hoặc hiệu ứng thuộc bản Pro.',
        },
        {
          q: 'Có dùng CapCut cho video quảng cáo của công ty được không?',
          a: 'Được về mặt kỹ thuật, nhưng nên đọc kỹ điều khoản sử dụng và bản quyền nhạc trước khi chạy quảng cáo trả tiền.',
        },
        {
          q: 'CapCut và Premiere Pro nên chọn cái nào?',
          a: 'Video ngắn, cần ra nhanh và đều thì chọn CapCut. Dự án dài, cần chỉnh màu sâu và làm việc nhóm theo quy trình thì chọn Premiere Pro.',
        },
      ],
      verdict:
        'Với người làm video ngắn, CapCut gần như không có đối thủ về tốc độ. Hãy bắt đầu từ bản miễn phí — chỉ nâng cấp lên Pro khi bạn thực sự thấy thiếu một hiệu ứng cụ thể.',
    },
  },

  // ─── Canva ─────────────────────────────────────────────────────────────────
  {
    slug: 'canva',
    content: `
<h2>Vì sao Canva phổ biến đến vậy</h2>
<p>Canva giải quyết một bài toán rất thực tế: người cần thiết kế thường không phải là người biết thiết kế. Thay vì học Photoshop, bạn chọn một mẫu có sẵn, thay chữ và ảnh, rồi xuất file.</p>
<p>Với doanh nghiệp nhỏ, giá trị lớn nhất không nằm ở tính năng mà ở chỗ cả đội — kể cả người không rành đồ hoạ — đều tự làm được ấn phẩm mà vẫn giữ đúng nhận diện thương hiệu.</p>

<h2>Dùng vào việc gì</h2>
<ul>
  <li><b>Ấn phẩm mạng xã hội:</b> bài đăng, ảnh bìa, thumbnail YouTube.</li>
  <li><b>Tài liệu bán hàng:</b> báo giá, hồ sơ năng lực, thuyết trình.</li>
  <li><b>Ấn phẩm in:</b> tờ rơi, danh thiếp, standee.</li>
  <li><b>Video ngắn:</b> đủ cho nhu cầu cơ bản, không thay thế được công cụ chuyên dụng.</li>
</ul>

<h2>Bộ nhận diện thương hiệu</h2>
<p>Đây là lý do chính khiến các đội nhóm chịu trả phí. Bạn nạp logo, bảng màu và bộ font vào một chỗ; sau đó mọi thành viên tạo ấn phẩm mới đều tự động đúng nhận diện, không còn cảnh mỗi người một kiểu.</p>
`.trim(),
    app: {
      tagline: 'Cả đội tự làm được ấn phẩm đúng nhận diện, không cần biết thiết kế.',
      website: 'https://www.canva.com',
      ctaText: 'Mở Canva',
      developer: 'Canva Pty Ltd',
      platforms: ['Web', 'Windows', 'macOS', 'iOS', 'Android'],
      pricingSummary: 'Miễn phí · Bản Pro theo tháng hoặc theo năm',
      languages: 'Tiếng Việt, English',
      shots: [
        { url: SHOT_C, caption: 'Kho mẫu phân theo từng loại ấn phẩm.' },
        { url: SHOT_A, caption: 'Bộ nhận diện thương hiệu — logo, màu và font dùng chung cho cả đội.' },
      ],
      scoreBreakdown: [
        { label: 'Dễ sử dụng', value: 9.8 },
        { label: 'Kho mẫu', value: 9.6 },
        { label: 'Làm việc nhóm', value: 9.3 },
        { label: 'Giá trị so với chi phí', value: 9.1 },
        { label: 'Chiều sâu thiết kế', value: 7.8 },
      ],
      pros: [
        'Người không biết thiết kế vẫn dùng được ngay',
        'Kho mẫu rất lớn, có mẫu hợp thị trường Việt',
        'Bộ nhận diện thương hiệu dùng chung cho cả đội',
        'Chạy trên trình duyệt, không cần cài đặt',
        'Xuất được nhiều định dạng, kể cả file in',
      ],
      cons: [
        'Không thay thế được Photoshop hay Illustrator cho việc chuyên sâu',
        'Nhiều mẫu và ảnh đẹp thuộc bản Pro',
        'Ấn phẩm dễ giống nhau nếu giữ nguyên mẫu',
        'Phụ thuộc kết nối mạng',
      ],
      bestFor: ['Doanh nghiệp nhỏ', 'Nhân viên marketing', 'Giáo viên', 'Chủ shop online', 'Người làm nội dung'],
      plans: [
        {
          name: 'Free',
          price: '0đ',
          period: 'miễn phí',
          features: ['Kho mẫu cơ bản', 'Lưu trữ 5GB', 'Xuất PNG, JPG, PDF'],
        },
        {
          name: 'Pro',
          price: '~120$',
          period: '/ năm',
          featured: true,
          features: ['Toàn bộ kho mẫu và ảnh', 'Bộ nhận diện thương hiệu', 'Xoá phông một chạm', 'Lưu trữ 1TB'],
        },
        {
          name: 'Teams',
          price: 'Liên hệ',
          period: '/ người / tháng',
          features: ['Quản lý theo nhóm', 'Duyệt ấn phẩm trước khi đăng', 'Phân quyền chi tiết'],
        },
      ],
      faq: [
        {
          q: 'Canva miễn phí dùng cho mục đích thương mại được không?',
          a: 'Được với các thành phần thuộc nhóm miễn phí. Với ảnh, font hoặc mẫu thuộc bản Pro thì cần tài khoản trả phí.',
        },
        {
          q: 'Canva có thay được Photoshop không?',
          a: 'Không, với việc chỉnh sửa ảnh chuyên sâu. Nhưng với phần lớn ấn phẩm marketing hằng ngày thì Canva nhanh hơn nhiều.',
        },
        {
          q: 'Canva và Figma khác nhau thế nào?',
          a: 'Canva mạnh ở ấn phẩm marketing dựng sẵn theo mẫu. Figma mạnh ở thiết kế giao diện phần mềm và làm việc nhóm theo hệ thống thiết kế.',
        },
      ],
      verdict:
        'Canva không dành cho nhà thiết kế chuyên nghiệp, và cũng không cố tỏ ra như vậy. Với một doanh nghiệp nhỏ cần ra ấn phẩm đều đặn mà không có người thiết kế riêng, đây là khoản đầu tư dễ sinh lời nhất.',
    },
  },
];

async function main() {
  await dataSource.initialize();
  console.log('📦 Kết nối DB thành công\n');

  for (const r of REVIEWS) {
    const res = await dataSource.query(
      `UPDATE "posts"
          SET "content" = $2,
              "productPageConfig" = COALESCE("productPageConfig", '{}'::jsonb)
                                    || jsonb_build_object(
                                         'app',
                                         COALESCE("productPageConfig"->'app', '{}'::jsonb) || $3::jsonb
                                       )
        WHERE "slug" = $1
        RETURNING "title"`,
      [r.slug, r.content, JSON.stringify(r.app)],
    );
    // TypeORM trả [rows, affectedCount] cho UPDATE ... RETURNING
    const rows = Array.isArray(res[0]) ? res[0] : res;
    const row = rows?.[0] as { title?: string } | undefined;

    if (row?.title) {
      const a = r.app as { shots?: unknown[]; pros?: unknown[]; plans?: unknown[]; faq?: unknown[] };
      console.log(
        `✅ ${row.title.padEnd(10)} — ${a.shots?.length ?? 0} ảnh · ${a.pros?.length ?? 0} ưu điểm · ${a.plans?.length ?? 0} gói giá · ${a.faq?.length ?? 0} FAQ`,
      );
    } else {
      console.log(`⚠️  Không tìm thấy app slug "${r.slug}" — bỏ qua`);
    }
  }

  console.log('\n⚠️  Giá và thông số là NỘI DUNG MẪU, cần kiểm chứng trước khi xuất bản.');
  console.log('⚠️  Ảnh đang dùng tạm file trong /uploads — thay bằng ảnh chụp thật ở /admin/ung-dung.');

  await dataSource.destroy();
  console.log('\n🎉 Seed review hoàn tất!');
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err);
  process.exit(1);
});
