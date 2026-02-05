export type ComputerQuizItem = {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
};

export const computerQuizItems: ComputerQuizItem[] = [
  {
    id: "server-true",
    statement:
      "サーバとは ネットワーク上で 何らかのサービスを提供する役割を持つデバイスやソフトウェアである。",
    isTrue: true,
    explanation:
      "正しい記述です。サーバはサービス提供側として振る舞います。",
  },
  {
    id: "server-false",
    statement:
      "サーバとは ネットワーク上でサービスを受け取る側のデバイスやソフトウェアである。",
    isTrue: false,
    explanation:
      "誤りです。サービスを提供するのがサーバで、受け取る側はクライアントです。",
  },
  {
    id: "client-true",
    statement:
      "クライアントとは サーバを利用するデバイスやソフトウェアである。",
    isTrue: true,
    explanation:
      "正しい記述です。クライアントはサーバの機能を利用します。",
  },
  {
    id: "request-response-true",
    statement:
      "リクエスト・レスポンス方式とは クライアントの要求に対して サーバが応答を返す通信方式である。",
    isTrue: true,
    explanation:
      "正しい記述です。クライアントの要求に対してサーバが応答します。",
  },
  {
    id: "request-response-false",
    statement:
      "リクエスト・レスポンス方式とは サーバが一方的に送信し続ける通信方式である。",
    isTrue: false,
    explanation:
      "誤りです。リクエスト・レスポンスはクライアントの要求とサーバの応答が前提です。",
  },
  {
    id: "host-true",
    statement: "ホストとは IP アドレスが割り当てられたデバイスである。",
    isTrue: true,
    explanation:
      "正しい記述です。IP アドレスを持つ端末がホストと呼ばれます。",
  },
  {
    id: "protocol-true",
    statement: "プロトコルとは ネットワークの決まり事をまとめたものである。",
    isTrue: true,
    explanation:
      "正しい記述です。通信の取り決めがプロトコルです。",
  },
  {
    id: "confidentiality-true",
    statement:
      "機密性の高いネットワークには 第 3 者に通信を盗聴されないよう 暗号化する機能が求められる。",
    isTrue: true,
    explanation:
      "正しい記述です。機密性の確保には暗号化が有効です。",
  },
  {
    id: "confidentiality-false",
    statement:
      "機密性の高いネットワークには 通信経路の冗長化だけが求められる。",
    isTrue: false,
    explanation:
      "誤りです。冗長化は可用性向上の手段であり、機密性には暗号化が必要です。",
  },
  {
    id: "availability-true",
    statement:
      "可用性の高いネットワークには 回線の一部に障害が発生しても 送信先と通信できる機能が求められる。",
    isTrue: true,
    explanation:
      "正しい記述です。障害時も通信できることが可用性です。",
  },
  {
    id: "star-true",
    statement:
      "スター型のネットワークとは 中心となるデバイスから 放射状に他のデバイスが接続されたものを指す。",
    isTrue: true,
    explanation:
      "正しい記述です。中心装置から放射状に接続される構成です。",
  },
  {
    id: "star-false",
    statement:
      "スター型のネットワークとは 中心となるデバイスを持たない構成を指す。",
    isTrue: false,
    explanation:
      "誤りです。中心装置があるのがスター型です。",
  },
  {
    id: "mesh-true",
    statement:
      "メッシュ型のネットワークとは デバイス同士が対等に接続され 中心が存在しないものを指す。",
    isTrue: true,
    explanation:
      "正しい記述です。メッシュは中心に依存しない構成です。",
  },
  {
    id: "mesh-false",
    statement:
      "メッシュ型のネットワークとは すべての通信が中央装置を必ず経由する構成である。",
    isTrue: false,
    explanation:
      "誤りです。中央装置を前提にしないのがメッシュ型です。",
  },
  {
    id: "unicast-true",
    statement: "ユニキャストとは 送信元が 特定の 1 つの端末にデータを送ることである。",
    isTrue: true,
    explanation:
      "正しい記述です。宛先が 1 つの通信がユニキャストです。",
  },
  {
    id: "unicast-false",
    statement:
      "ユニキャストとは 送信元が 同じネットワーク上のすべての端末にデータを送ることである。",
    isTrue: false,
    explanation:
      "誤りです。全端末に送るのはブロードキャストです。",
  },
  {
    id: "broadcast-true",
    statement:
      "ブロードキャストとは 送信元が 同じネットワーク上のすべての端末にデータを送ることである。",
    isTrue: true,
    explanation:
      "正しい記述です。ブロードキャストは全端末への送信です。",
  },
  {
    id: "tcpip-true",
    statement:
      "TCP/IP とは インターネットで標準的に使用されているプロトコルの集合である。",
    isTrue: true,
    explanation:
      "正しい記述です。インターネット標準のプロトコル群です。",
  },
  {
    id: "osi-true",
    statement:
      "プロトコルの機能の分類には しばしば 7 層構造の OSI 参照モデル が使われる。",
    isTrue: true,
    explanation:
      "正しい記述です。OSI 参照モデルは 7 層構造です。",
  },
  {
    id: "tcp-layer-true",
    statement: "TCP は OSI 参照モデルの L4 に分類されるプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。TCP はトランスポート層のプロトコルです。",
  },
  {
    id: "tcp-layer-false",
    statement: "TCP は OSI 参照モデルの L3 に分類されるプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。TCP は L4（トランスポート層）です。",
  },
  {
    id: "ip-layer-true",
    statement: "IP は OSI 参照モデルの L3 に分類されるプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。IP はネットワーク層のプロトコルです。",
  },
  {
    id: "ip-layer-false",
    statement: "IP は OSI 参照モデルの L4 に分類されるプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。IP は L3（ネットワーク層）です。",
  },
  {
    id: "ethernet-layer-true",
    statement: "Ethernet は OSI 参照モデルの L2 に分類されるプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。Ethernet はデータリンク層のプロトコルです。",
  },
  {
    id: "ethernet-layer-false",
    statement: "Ethernet は OSI 参照モデルの L3 に分類されるプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。Ethernet は L2（データリンク層）です。",
  },
  {
    id: "pdu-true",
    statement: "PDU とは 各通信プロトコル層で送受信されるデータの単位を指す。",
    isTrue: true,
    explanation:
      "正しい記述です。PDU は各層でのデータ単位です。",
  },
  {
    id: "l7-message-true",
    statement: "L7 では，HTTP や SMTP などのプロトコルによって メッセージ が生成される。",
    isTrue: true,
    explanation:
      "正しい記述です。アプリケーション層でメッセージが作られます。",
  },
  {
    id: "l4-segment-true",
    statement:
      "L4 では，メッセージに TCP や UDP のヘッダ が付加されセグメント（またはデータグラム）が生成される。",
    isTrue: true,
    explanation:
      "正しい記述です。L4 でセグメントやデータグラムが作られます。",
  },
  {
    id: "l3-packet-true",
    statement:
      "L3 では，セグメント（またはデータグラム）などに IP ヘッダ が付加され，パケットが生成される。",
    isTrue: true,
    explanation:
      "正しい記述です。IP ヘッダ追加でパケットになります。",
  },
  {
    id: "l2-frame-true",
    statement:
      "L2 では，IP パケットなどに ヘッダとトレーラ が付加され，フレームが生成される。",
    isTrue: true,
    explanation:
      "正しい記述です。L2 でフレームが生成されます。",
  },
  {
    id: "plaintext-true",
    statement:
      "平文とは 意味の分かるデータであり それと相互に変換可能な意味不明のデータを暗号文と呼ぶ。",
    isTrue: true,
    explanation:
      "正しい記述です。平文と暗号文は相互に変換可能です。",
  },
  {
    id: "hash-false",
    statement: "ハッシュ化とは 元のデータに復元できる形に変換することである。",
    isTrue: false,
    explanation:
      "誤りです。ハッシュ化は原則として元に戻せない変換です。",
  },
  {
    id: "hash-true",
    statement:
      "ハッシュ化とは 元のデータに復元できない形かつ一定の長さの形に変換することである。",
    isTrue: true,
    explanation:
      "正しい記述です。ハッシュ値は一定長で不可逆です。",
  },
  {
    id: "symmetric-true",
    statement:
      "共通鍵暗号方式とは 暗号化・復号に用いる 1 種類の鍵を 送信元と先で共有する 1 対 1 の暗号方式である。",
    isTrue: true,
    explanation:
      "正しい記述です。共通鍵暗号は同じ鍵を共有します。",
  },
  {
    id: "symmetric-false",
    statement:
      "共通鍵暗号方式とは 2 種類の鍵を使い 公開鍵だけを共有する暗号方式である。",
    isTrue: false,
    explanation:
      "誤りです。2 種類の鍵を使うのは公開鍵暗号方式です。",
  },
  {
    id: "asymmetric-true",
    statement:
      "公開鍵暗号方式とは 2 本 1 組の暗号鍵と復号鍵の一方を 送信元と先で共有する 1 対多の暗号方式である。",
    isTrue: true,
    explanation:
      "正しい記述です。公開鍵暗号は鍵ペアの片方を共有します。",
  },
  {
    id: "asymmetric-false",
    statement:
      "公開鍵暗号方式では 復号鍵を第三者にも公開して使う。",
    isTrue: false,
    explanation:
      "誤りです。公開するのは暗号鍵（公開鍵）で、復号鍵（秘密鍵）は公開しません。",
  },
  {
    id: "smtp-true",
    statement:
      "SMTP とは，主に「電子メールをメールサーバからメールサーバへと転送する手順」を示したプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。SMTP はメールの送信・転送に使われます。",
  },
  {
    id: "smtp-false",
    statement:
      "SMTP は メールサーバ上のメールを確認するためのプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。メールを確認するのは POP3 や IMAP です。",
  },
  {
    id: "pop3-true",
    statement:
      "「POP3」や「IMAP」とは，メールサーバ上の電子メールを，メーラで確認するためのプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。POP3/IMAP はメール取得に使われます。",
  },
  {
    id: "http-true",
    statement:
      "HTTP は，HTML ファイルなど，Web ページを構成するファイルを転送するためのプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。HTTP は Web コンテンツ転送のプロトコルです。",
  },
  {
    id: "http-port-true",
    statement: "HTTP サーバにリクエストする際は，送信先ポート番号に 80 番が使われる。",
    isTrue: true,
    explanation:
      "正しい記述です。HTTP の標準ポートは 80 番です。",
  },
  {
    id: "http-port-false",
    statement: "HTTP サーバにリクエストする際は，送信先ポート番号に 443 番が使われる。",
    isTrue: false,
    explanation:
      "誤りです。443 番は HTTPS の標準ポートで、HTTP は 80 番です。",
  },
  {
    id: "https-true",
    statement: "HTTP 通信を SSL/TLS によって暗号化したものを HTTPS と呼ぶ。",
    isTrue: true,
    explanation:
      "正しい記述です。HTTPS は暗号化された HTTP です。",
  },
  {
    id: "https-false",
    statement: "HTTPS は HTTP を圧縮するためのプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。HTTPS は暗号化のために SSL/TLS を使います。",
  },
  {
    id: "get-true",
    statement:
      "HTTP リクエストの GET メソッドは，指定した URL のデータを取得するためのメソッドである。",
    isTrue: true,
    explanation:
      "正しい記述です。GET は取得が目的のメソッドです。",
  },
  {
    id: "post-false",
    statement:
      "HTTP リクエストの POST メソッドは，URL の内容を閲覧するためだけのメソッドである。",
    isTrue: false,
    explanation:
      "誤りです。POST はデータ送信に利用されるメソッドです。",
  },
  {
    id: "status-200-true",
    statement:
      "HTTP レスポンスのステータスコードの内 200 番台は，リクエストが正常に処理されたことを示す。",
    isTrue: true,
    explanation:
      "正しい記述です。2xx は成功を表します。",
  },
  {
    id: "status-400-false",
    statement:
      "HTTP レスポンスのステータスコードの内 400 番台は，リクエストが正常に処理されたことを示す。",
    isTrue: false,
    explanation:
      "誤りです。4xx はクライアント側のエラーを示します。",
  },
  {
    id: "ssh-true",
    statement:
      "SSH は 暗号化された通信を使って サーバを遠隔操作するためのプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。SSH は安全な遠隔操作に使われます。",
  },
  {
    id: "ssh-false",
    statement: "SSH は GUI だけを使った操作をサポートするプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。SSH は主に CUI のコマンド入出力を扱います。",
  },
  {
    id: "icmp-true",
    statement:
      "ICMP のエコー要求とエコー応答を利用して通信の到達確認を行うコマンドが ping である。",
    isTrue: true,
    explanation:
      "正しい記述です。ping は ICMP エコーを使います。",
  },
  {
    id: "icmp-false",
    statement: "ICMP は ファイル転送を行うためのプロトコルである。",
    isTrue: false,
    explanation:
      "誤りです。ICMP は主にエラー通知や到達確認に使われます。",
  },
  {
    id: "dhcp-true",
    statement:
      "DHCP は，ネットワークに接続されたデバイスに対して IP アドレスを自動で割り当てるプロトコルである。",
    isTrue: true,
    explanation:
      "正しい記述です。DHCP は IP アドレスの自動割当てを行います。",
  },
  {
    id: "dhcp-false",
    statement: "DHCP の各メッセージは TCP のセグメントに格納されて送受信される。",
    isTrue: false,
    explanation:
      "誤りです。DHCP は UDP のデータグラムで送受信されます。",
  },
  {
    id: "nat-true",
    statement:
      "NAT / NAPT は ルータが LAN の内側からのリクエストに対して、プライベート IP アドレスとグローバル IP アドレスを変換する方式である。",
    isTrue: true,
    explanation:
      "正しい記述です。NAT はアドレス変換を行います。",
  },
  {
    id: "nat-false",
    statement: "NAT は MAC アドレス同士を変換する方式である。",
    isTrue: false,
    explanation:
      "誤りです。NAT は IP アドレスを変換する方式です。",
  },
  {
    id: "mac-true",
    statement: "MAC アドレスは 長さが 48bit のビット列である。",
    isTrue: true,
    explanation:
      "正しい記述です。MAC アドレスは 48bit です。",
  },
  {
    id: "mac-false",
    statement: "MAC アドレスは 長さが 32bit のビット列である。",
    isTrue: false,
    explanation:
      "誤りです。MAC アドレスは 48bit です。",
  },
  {
    id: "l2-switch-true",
    statement:
      "L2 スイッチは フレーム中の宛先 MAC アドレスを参考に 転送先のポートを決定する。",
    isTrue: true,
    explanation:
      "正しい記述です。L2 スイッチは MAC アドレスで転送先を選びます。",
  },
  {
    id: "l2-switch-false",
    statement:
      "L2 スイッチは IP アドレスだけを見て転送先のポートを決定する。",
    isTrue: false,
    explanation:
      "誤りです。L2 スイッチは MAC アドレスで転送先を決めます。",
  },
  {
    id: "ethernet-header-true",
    statement: "Ethernet のヘッダの長さは，固定長の 14 オクテットである。",
    isTrue: true,
    explanation:
      "正しい記述です。Ethernet ヘッダは 14 バイトです。",
  },
  {
    id: "ethernet-header-false",
    statement: "Ethernet のヘッダの長さは，固定長の 18 オクテットである。",
    isTrue: false,
    explanation:
      "誤りです。Ethernet ヘッダは 14 オクテットです。",
  },
  {
    id: "payload-true",
    statement:
      "Ethernet のペイロード（データの本体）の長さは，可変長で最大 1500 オクテットである。",
    isTrue: true,
    explanation:
      "正しい記述です。Ethernet のペイロード最大は 1500 バイトです。",
  },
  {
    id: "payload-false",
    statement:
      "Ethernet のペイロードの長さは，最大 500 オクテットに固定されている。",
    isTrue: false,
    explanation:
      "誤りです。Ethernet のペイロード最大は 1500 オクテットです。",
  },
  {
    id: "fcs-true",
    statement:
      "フレームの末尾に付与される FCS は，フレームの破損を確認するための情報である。",
    isTrue: true,
    explanation:
      "正しい記述です。FCS は誤り検出のための情報です。",
  },
  {
    id: "fcs-false",
    statement:
      "フレームの末尾に付与される FCS は，フレームを暗号化するための情報である。",
    isTrue: false,
    explanation:
      "誤りです。FCS は誤り検出のための情報で、暗号化ではありません。",
  },
];
