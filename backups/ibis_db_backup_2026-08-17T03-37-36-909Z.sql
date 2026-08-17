--
-- PostgreSQL database dump
--

\restrict KRtw4driKs5lmaZajXk7vFXRFexKdOfbqPmqPF268Ivp5OfeYSQxzufvrDeM0LK

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'FIELD',
    'WAREHOUSE',
    'INVENTORY',
    'FINANCE',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "userName" text NOT NULL,
    "userRole" public."Role" NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    details text,
    "ipAddress" text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Bank; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bank" (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Bank" OWNER TO postgres;

--
-- Name: FarmerProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FarmerProfile" (
    id text NOT NULL,
    "familyCode" text NOT NULL,
    "farmerName" text NOT NULL,
    village text NOT NULL,
    phone text,
    "paymentMethod" text DEFAULT 'Bank Transfer'::text NOT NULL,
    "bankName" text,
    "accountNumber" text,
    "accountHolder" text,
    relationship text DEFAULT 'Self'::text NOT NULL,
    "bankDocumentUrl" text,
    notes text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FarmerProfile" OWNER TO postgres;

--
-- Name: FleetVehicle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FleetVehicle" (
    id text NOT NULL,
    "plateNumber" text NOT NULL,
    "driverName" text NOT NULL,
    "driverPhone" text,
    "maxWeightKg" double precision,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FleetVehicle" OWNER TO postgres;

--
-- Name: LocationRegistry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LocationRegistry" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    code text,
    address text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."LocationRegistry" OWNER TO postgres;

--
-- Name: PaddyPriceSpec; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaddyPriceSpec" (
    id text NOT NULL,
    variety text NOT NULL,
    grade text NOT NULL,
    "basePrice" double precision NOT NULL,
    "maxMoisture" double precision DEFAULT 14.0 NOT NULL,
    "maxForeignMatter" double precision DEFAULT 5.0 NOT NULL,
    "minWholeGrain" double precision DEFAULT 70.0,
    "maxBrokenRice" double precision DEFAULT 30.0,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    impurity double precision,
    "moistureRange" text
);


ALTER TABLE public."PaddyPriceSpec" OWNER TO postgres;

--
-- Name: PurchaseItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseItem" (
    id text NOT NULL,
    "purchaseId" text NOT NULL,
    variety text NOT NULL,
    grade text NOT NULL,
    "standardPrice" double precision NOT NULL,
    "additionalPrice" double precision DEFAULT 0 NOT NULL,
    "finalPrice" double precision NOT NULL,
    sacks integer NOT NULL,
    quantity double precision NOT NULL,
    "totalValue" double precision NOT NULL,
    "sackWeights" text
);


ALTER TABLE public."PurchaseItem" OWNER TO postgres;

--
-- Name: PurchaseRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PurchaseRecord" (
    id text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "familyCode" text NOT NULL,
    "farmerName" text NOT NULL,
    village text NOT NULL,
    "totalWeight" double precision NOT NULL,
    "totalPayment" double precision NOT NULL,
    "seedBorrowed" double precision DEFAULT 0 NOT NULL,
    "seedRepayment" double precision DEFAULT 0 NOT NULL,
    "seedDeduction" double precision DEFAULT 0 NOT NULL,
    "additionalPremium" double precision DEFAULT 0 NOT NULL,
    "netPayment" double precision NOT NULL,
    "signatureFarmer" text,
    "signatureStaff" text,
    "purchasingStaffId" text,
    "purchasingStaffName" text,
    "specsRecordId" text,
    "transportRecordId" text,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."PurchaseRecord" OWNER TO postgres;

--
-- Name: RejectionLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RejectionLog" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "targetModule" text NOT NULL,
    "rejectedBy" text NOT NULL,
    "rejectedByName" text NOT NULL,
    "rejectedByRole" public."Role" NOT NULL,
    reason text NOT NULL,
    status text DEFAULT 'REJECTED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone,
    "resolvedByName" text
);


ALTER TABLE public."RejectionLog" OWNER TO postgres;

--
-- Name: SpecsRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SpecsRecord" (
    id text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "familyCode" text NOT NULL,
    "farmerName" text NOT NULL,
    village text NOT NULL,
    "paddyType" text NOT NULL,
    "selectedGrade" text NOT NULL,
    "isOrganic" boolean DEFAULT true NOT NULL,
    moisture double precision NOT NULL,
    "foreignMatter" double precision NOT NULL,
    purity double precision,
    impurity double precision,
    "wholeGrain" double precision,
    "brokenRice" double precision,
    "isValid" boolean NOT NULL,
    "basePrice" double precision NOT NULL,
    "finalPrice" double precision NOT NULL,
    "bestQualifyingGrade" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SpecsRecord" OWNER TO postgres;

--
-- Name: SystemSetting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SystemSetting" (
    id text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SystemSetting" OWNER TO postgres;

--
-- Name: TransportLot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransportLot" (
    id text NOT NULL,
    "transportId" text NOT NULL,
    variety text NOT NULL,
    "familyCode" text NOT NULL,
    "farmerName" text,
    village text NOT NULL,
    sacks integer NOT NULL,
    weight double precision NOT NULL,
    "purchaseRecordId" text
);


ALTER TABLE public."TransportLot" OWNER TO postgres;

--
-- Name: TransportRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."TransportRecord" (
    id text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "driverName" text NOT NULL,
    "plateNumber" text NOT NULL,
    "mobileNumber" text,
    "truckCleaned" boolean DEFAULT false NOT NULL,
    "fieldStaffName" text,
    "fieldStaffDate" text,
    "fieldStaffTime" text,
    "driverWitnessName" text,
    "driverWitnessDate" text,
    "driverWitnessTime" text,
    "loadingLocation" text,
    "destinationWarehouse" text,
    notes text,
    "totalSacks" integer NOT NULL,
    "totalFieldWeight" double precision NOT NULL,
    status text DEFAULT 'EN_ROUTE'::text NOT NULL,
    "paymentReceiptUrl" text,
    "paymentMethod" text,
    "paymentBatchNumber" text,
    "paidAt" timestamp(3) without time zone,
    "paidByStaffName" text,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "truckPhotoUrl" text,
    "driverSignature" text
);


ALTER TABLE public."TransportRecord" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'FIELD'::public."Role" NOT NULL,
    "assignedProvinces" text DEFAULT 'Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri'::text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Village; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Village" (
    id text NOT NULL,
    name text NOT NULL,
    code text,
    district text,
    province text DEFAULT 'Preah Vihear'::text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Village" OWNER TO postgres;

--
-- Name: WarehouseIntake; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."WarehouseIntake" (
    id text NOT NULL,
    "transportId" text NOT NULL,
    "arrivalTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "warehouseGrossWeight" double precision NOT NULL,
    "warehouseTareWeight" double precision NOT NULL,
    "warehouseNetWeight" double precision NOT NULL,
    "weightDiffKg" double precision NOT NULL,
    "weightDiffPercent" double precision DEFAULT 0,
    "grossScalePhotoUrl" text,
    "tareScalePhotoUrl" text,
    "transportInvoiceUrl" text,
    "receivingStaffId" text NOT NULL,
    "receivingStaffName" text,
    notes text,
    "inventoryStatus" text DEFAULT 'WAITING_FOR_INVENTORY'::text NOT NULL,
    "inventoryStaffId" text,
    "inventoryStaffName" text,
    "inventoryConfirmedAt" timestamp(3) without time zone,
    "inventoryLocation" text,
    "inventoryNotes" text,
    status text DEFAULT 'RECEIVED'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."WarehouseIntake" OWNER TO postgres;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "userId", "userName", "userRole", action, "entityType", "entityId", details, "ipAddress", "timestamp") FROM stdin;
cmsmxpuou0003f2xw4efc1qva	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxpuoo0001f2xw37tl26dx	{"familyCode":"TB001","village":"Tmat Paeuy","farmerName":"TB1","paddyType":"Phka Rumduol","selectedGrade":"A2","finalPrice":1550}	\N	2026-08-10 07:53:24.894
cmsmxq9qt0007f2xw18ldh9nz	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxq9qr0005f2xwr2grt4us	{"familyCode":"TB002","village":"Tmat Paeuy","farmerName":"TB2","paddyType":"Red Jasmine","selectedGrade":"A1","finalPrice":1850}	\N	2026-08-10 07:53:44.406
cmsmxqld7000bf2xwpdlvtica	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxqld10009f2xwm7l7i9tv	{"familyCode":"TB003","village":"Tmat Paeuy","farmerName":"TB3","paddyType":"White Rice","selectedGrade":"B","finalPrice":1220}	\N	2026-08-10 07:53:59.467
cmsmxqxgf000ff2xwhlug44ml	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxqxg8000df2xwi57xyecd	{"familyCode":"TB004","village":"Tmat Paeuy","farmerName":"TB4","paddyType":"Certified Seed","selectedGrade":"A","finalPrice":1900}	\N	2026-08-10 07:54:15.135
cmsmxrdem000jf2xw6q3a1y0a	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxrdeg000hf2xw6gep3gep	{"familyCode":"TB005","village":"Tmat Paeuy","farmerName":"TB5","paddyType":"Foundation Seed - Phka Rumduol","selectedGrade":"A","finalPrice":2050}	\N	2026-08-10 07:54:35.807
cmsmxrs3z000nf2xw2pwc59re	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsmxrs3t000lf2xwqbpo7w10	{"familyCode":"TB006","village":"Tmat Paeuy","farmerName":"TB6","paddyType":"Foundation Seed - Red Jasmine","selectedGrade":"A","finalPrice":2150}	\N	2026-08-10 07:54:54.863
cmsmy0py90003f2fo9ifm508o	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy0py50001f2fo9tg0m75c	{"familyCode":"TB001","village":"Tmat Paeuy","farmerName":"TB1","bankName":"ABA Bank","accountNumber":"","hasBankPhoto":true}	\N	2026-08-10 08:01:51.969
cmsmy142h0005f2folq9ti87y	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	FarmerProfile	cmsmy0py50001f2fo9tg0m75c	{"familyCode":"TB001","farmerName":"TB1","bankName":"ABA Bank","accountNumber":"09876789876","accountHolder":"TB2","relationship":"Husband"}	\N	2026-08-10 08:02:10.266
cmsmy1jiq0009f2foizgd3vsw	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy1jil0007f2fobdukj8cf	{"familyCode":"TB002","village":"Tmat Paeuy","farmerName":"TB2","bankName":"ABA Bank","accountNumber":"98767890987","hasBankPhoto":true}	\N	2026-08-10 08:02:30.291
cmsmy26bd000df2foz2hrc3s7	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy26b8000bf2fo3m0kuj10	{"familyCode":"TB003","village":"Tmat Paeuy","farmerName":"TB3","bankName":"ABA Bank","accountNumber":"987678","hasBankPhoto":true}	\N	2026-08-10 08:02:59.833
cmsmy2m3m000hf2fo8shwnt1z	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy2m3f000ff2foz8nramon	{"familyCode":"TB004","village":"Tmat Paeuy","farmerName":"TB4","bankName":"ABA Bank","accountNumber":"09876789","hasBankPhoto":true}	\N	2026-08-10 08:03:20.29
cmsmy31jo000lf2foxsdbsnl5	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy31jj000jf2foee4ewrpc	{"familyCode":"TB005","village":"Tmat Paeuy","farmerName":"TB5","bankName":"ACLEDA Bank","accountNumber":"09876789","hasBankPhoto":true}	\N	2026-08-10 08:03:40.309
cmsmy3nxz000pf2fo5hmg2y2e	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsmy3nxt000nf2fo5lbb4l5v	{"familyCode":"TB006","village":"Tmat Paeuy","farmerName":"TB6","bankName":"ABA Bank","accountNumber":"6534231253564","hasBankPhoto":true}	\N	2026-08-10 08:04:09.335
cmsmy5g2r000uf2fot7u0jutj	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy5g2h000rf2fodmzvpxhh	{"familyCode":"TB001","village":"Tmat Paeuy","farmerName":"TB1","totalWeight":500,"totalPayment":800000,"netPayment":782950,"purchasingStaff":"piseth","sackCount":5,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxpuoo0001f2xw37tl26dx"}	\N	2026-08-10 08:05:32.452
cmsmy63os000wf2fox51hic9p	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	PurchaseRecord	cmsmy5g2h000rf2fodmzvpxhh	{"familyCode":"TB001","farmerName":"TB1","totalWeight":590,"netPayment":926950}	\N	2026-08-10 08:06:03.052
cmsmy6oq70011f2fotz3phrp3	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy6opw000yf2fo329iw156	{"familyCode":"TB002","village":"Tmat Paeuy","farmerName":"TB2","totalWeight":630,"totalPayment":1165500,"netPayment":1165500,"purchasingStaff":"piseth","sackCount":7,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxq9qr0005f2xwr2grt4us"}	\N	2026-08-10 08:06:30.319
cmsmy76b60016f2foway7mqyx	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy76ay0013f2fo015p0y54	{"familyCode":"TB003","village":"Tmat Paeuy","farmerName":"TB3","totalWeight":588,"totalPayment":717360,"netPayment":703940,"purchasingStaff":"piseth","sackCount":6,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxqld10009f2xwm7l7i9tv"}	\N	2026-08-10 08:06:53.107
cmsmy7w6s001bf2fo7b6mojxq	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy7w6j0018f2fol7gmu6vh	{"familyCode":"TB004","village":"Tmat Paeuy","farmerName":"TB4","totalWeight":686,"totalPayment":1372000,"netPayment":1372000,"purchasingStaff":"piseth","sackCount":7,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxqxg8000df2xwi57xyecd"}	\N	2026-08-10 08:07:26.644
cmsmy8ero001gf2foj1cz2ax9	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy8erg001df2focx7h5elu	{"familyCode":"TB005","village":"Tmat Paeuy","farmerName":"TB5","totalWeight":538,"totalPayment":1102900,"netPayment":1057800,"purchasingStaff":"piseth","sackCount":6,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxrdeg000hf2xw6gep3gep"}	\N	2026-08-10 08:07:50.724
cmsmy8whi001lf2fope059ev0	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmy8wh9001if2fo130suqey	{"familyCode":"TB006","village":"Tmat Paeuy","farmerName":"TB6","totalWeight":526,"totalPayment":1130900,"netPayment":1130900,"purchasingStaff":"piseth","sackCount":6,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxrs3t000lf2xwqbpo7w10"}	\N	2026-08-10 08:08:13.686
cmsmy9qno001nf2fo4ghgy24z	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	PurchaseRecord	cmsmy8wh9001if2fo130suqey	{"familyCode":"TB006","farmerName":"TB6","totalWeight":615,"netPayment":1322250}	\N	2026-08-10 08:08:52.788
cmsmya23m001pf2fo8ndgdsag	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	FarmerProfile	cmsmy0py50001f2fo9tg0m75c	{"familyCode":"TB001","farmerName":"TB1","bankName":"ACLEDA Bank","accountNumber":"09876789876","accountHolder":"TB2","relationship":"Husband"}	\N	2026-08-10 08:09:07.618
cmsmyhj9z001wf2fodtsllsku	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	TransportRecord	cmsmyhj9s001rf2fo6akwm1mw	{"driverName":"Tansporter_1","plateNumber":"3A-8967","totalSacks":20,"totalFieldWeight":1904,"purchaseCount":3}	\N	2026-08-10 08:14:56.472
cmsmyibdz0020f2fo3utnivb3	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	TransportRecord	cmsmyhj9s001rf2fo6akwm1mw	{"driverName":"Tansporter_1","plateNumber":"3A-8967","totalSacks":13,"totalFieldWeight":1218,"purchaseCount":2}	\N	2026-08-10 08:15:32.904
cmsmyqesw0024f2foyvx5dbod	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	INTAKE	WarehouseIntake	cmsmyqess0022f2foeytytfp9	{"transportId":"cmsmyhj9s001rf2fo6akwm1mw","warehouseNetWeight":1218,"fieldWeight":1218,"diffKg":0,"diffPercent":0}	\N	2026-08-10 08:21:50.576
cmsmyqndn0026f2fozjsml5f8	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	UPDATE	WarehouseIntake	cmsmyqess0022f2foeytytfp9	{"transportId":"cmsmyhj9s001rf2fo6akwm1mw","grossWeight":1318,"tareWeight":100,"netWeight":1218,"weightDiffKg":0}	\N	2026-08-10 08:22:01.692
cmsmyu02p0028f2fobu9vb55h	cmsifyehs000pf2cwvxi4y29e	bousong	INVENTORY	CONFIRM_INVENTORY	WarehouseIntake	cmsmyqess0022f2foeytytfp9	{"warehouseId":"WR-2026-TYTFP9","inventoryLocation":"To Lot ABC","netWeight":1218}	\N	2026-08-10 08:24:38.113
cmsmyw25u002af2foo2ehr7n0	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	VERIFY	TransportRecord	cmsmyhj9s001rf2fo6akwm1mw	{"plateNumber":"3A-8967","status":"VERIFIED"}	\N	2026-08-10 08:26:14.131
cmsmyw9t5002cf2fo7d2gz3n2	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	DISBURSE	TransportRecord	cmsmyhj9s001rf2fo6akwm1mw	{"plateNumber":"3A-8967","paymentMethod":"ABA Bulk Transfer","paymentBatchNumber":"BATCH-20260810","paymentReceiptUrl":"/uploads/doc_1786350381916_brq2m8.png","status":"DISBURSED"}	\N	2026-08-10 08:26:24.042
cmsmz9vum0001f23k1wjrrvty	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	DELETE	PurchaseRecord	cmsmy5g2h000rf2fodmzvpxhh	{"familyCode":"TB001","farmerName":"TB1","village":"Tmat Paeuy","totalWeight":590,"netPayment":926950}	\N	2026-08-10 08:36:59.133
cmsmzargc0006f23kk51ipihx	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsmzarg20003f23kacrpwjnn	{"familyCode":"TB001","village":"Tmat Paeuy","farmerName":"TB1","totalWeight":810,"totalPayment":1255500,"netPayment":1255500,"purchasingStaff":"piseth","sackCount":9,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsmxpuoo0001f2xw37tl26dx"}	\N	2026-08-10 08:37:40.092
cmsmzcq0z000ef23kz8x4stnv	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"driverName":"Transporter_2","plateNumber":"3A-8888","totalSacks":29,"totalFieldWeight":2649,"purchaseCount":4}	\N	2026-08-10 08:39:11.555
cmsmzdlkj000if23knnrvfx64	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	REJECT	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"targetModule":"FIELD","reason":"Check Invoice"}	\N	2026-08-10 08:39:52.436
cmsmzfc19000of23kq6spdp4l	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"driverName":"Transporter_2","plateNumber":"3A-8888","totalSacks":29,"totalFieldWeight":2649,"purchaseCount":4}	\N	2026-08-10 08:41:13.39
cmsmzgjpd000sf23kz9c6tqce	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	INTAKE	WarehouseIntake	cmsmzgjp2000qf23kwqxnlbq6	{"transportId":"cmsmzcq0u0008f23kxm6n69ba","warehouseNetWeight":2650,"fieldWeight":2649,"diffKg":1,"diffPercent":0.04}	\N	2026-08-10 08:42:09.985
cmsmzhk8o000wf23ki94k8u48	cmsifyehs000pf2cwvxi4y29e	bousong	INVENTORY	REJECT	WarehouseIntake	cmsmzgjp2000qf23kwqxnlbq6	{"targetModule":"WAREHOUSE","reason":"check weigh invoice"}	\N	2026-08-10 08:42:57.337
cmsmzihvd0010f23kr4h0a6yp	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	REJECT	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"targetModule":"FIELD","reason":"check invoice"}	\N	2026-08-10 08:43:40.921
cmsmzj3970016f23k27h2rr0z	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	UPDATE	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"driverName":"Transporter_2","plateNumber":"3A-8888","totalSacks":29,"totalFieldWeight":2649,"purchaseCount":4}	\N	2026-08-10 08:44:08.635
cmsmzjzf8001af23kdrg16sey	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	INTAKE	WarehouseIntake	cmsmzjzew0018f23kpxj9ix51	{"transportId":"cmsmzcq0u0008f23kxm6n69ba","warehouseNetWeight":2650,"fieldWeight":2649,"diffKg":1,"diffPercent":0.04}	\N	2026-08-10 08:44:50.324
cmsmzkhk3001cf23kad4iknas	cmsifyehs000pf2cwvxi4y29e	bousong	INVENTORY	CONFIRM_INVENTORY	WarehouseIntake	cmsmzjzew0018f23kpxj9ix51	{"warehouseId":"WR-2026-J9IX51","inventoryLocation":"ST","netWeight":2650}	\N	2026-08-10 08:45:13.827
cmsmzl2pm001gf23khmj7nwb9	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	REJECT	WarehouseIntake	cmsmzjzew0018f23kpxj9ix51	{"targetModule":"INVENTORY","reason":"chek not book"}	\N	2026-08-10 08:45:41.243
cmsmzmn6v001if23k1rvzrxfi	cmsifyehs000pf2cwvxi4y29e	bousong	INVENTORY	CONFIRM_INVENTORY	WarehouseIntake	cmsmzjzew0018f23kpxj9ix51	{"warehouseId":"WR-2026-J9IX51","inventoryLocation":"Silo 01 - Stack A","netWeight":2650}	\N	2026-08-10 08:46:54.439
cmsmzo3vc001kf23k64nhadft	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	VERIFY	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"plateNumber":"3A-8888","status":"VERIFIED"}	\N	2026-08-10 08:48:02.712
cmsmzo8yx001mf23koqujdlb5	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	DISBURSE	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	{"plateNumber":"3A-8888","paymentMethod":"ABA Bulk Transfer","paymentBatchNumber":"BATCH-20260810","paymentReceiptUrl":"/uploads/doc_1786351688385_iqm4ui.png","status":"DISBURSED"}	\N	2026-08-10 08:48:09.322
cmsn07sk6001qf23kqmifdu4n	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	SpecsRecord	cmsn07sk0001of23kgumhbm2m	{"familyCode":"TB007","village":"Tmat Paeuy","farmerName":"TB7","paddyType":"Phka Rumduol","selectedGrade":"A1","finalPrice":1650}	\N	2026-08-10 09:03:21.174
cmsn08bsw001uf23k93il85lh	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	FarmerProfile	cmsn08bsv001sf23kdsd5i2hf	{"familyCode":"TB007","village":"Tmat Paeuy","farmerName":"TB7","bankName":"ABA Bank","accountNumber":"987656789","hasBankPhoto":true}	\N	2026-08-10 09:03:46.113
cmsn08si2001zf23ki4tl0wz8	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	CREATE	PurchaseRecord	cmsn08shu001wf23korqgmfjf	{"familyCode":"TB007","village":"Tmat Paeuy","farmerName":"TB7","totalWeight":360,"totalPayment":594000,"netPayment":594000,"purchasingStaff":"piseth","sackCount":4,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmsn07sk0001of23kgumhbm2m"}	\N	2026-08-10 09:04:07.755
cmsn097yb0021f23ktefiyogi	cmsifyddo0000f2cw8rymkatf	piseth	FIELD	DELETE	PurchaseRecord	cmsn08shu001wf23korqgmfjf	{"familyCode":"TB007","farmerName":"TB7","village":"Tmat Paeuy","totalWeight":360,"netPayment":594000}	\N	2026-08-10 09:04:27.779
cmssoffvn0003f2cc48kwu7jf	cmsifydp10007f2cwf4wbnm6h	chansetha	ADMIN	CREATE	SpecsRecord	cmssoffva0001f2ccob2v4mzz	{"familyCode":"AK001","village":"Andoung Kraloeng","farmerName":"AT1","paddyType":"Phka Rumduol","selectedGrade":"A1","finalPrice":1650}	\N	2026-08-14 08:19:59.651
cmssog6xn0007f2cc00nl6d2a	cmsifydp10007f2cwf4wbnm6h	chansetha	ADMIN	CREATE	FarmerProfile	cmssog6x80005f2cc370pnrnn	{"familyCode":"AK001","village":"Andoung Kraloeng","farmerName":"AT1","bankName":"ABA Bank","accountNumber":"98765678","hasBankPhoto":true}	\N	2026-08-14 08:20:34.715
cmssoiclx000cf2ccblnfi03k	cmsifydp10007f2cwf4wbnm6h	chansetha	ADMIN	CREATE	PurchaseRecord	cmssoicli0009f2cctw1uburt	{"familyCode":"AK001","village":"Andoung Kraloeng","farmerName":"AT1","totalWeight":693,"totalPayment":1178100,"netPayment":1140700,"purchasingStaff":"chansetha","sackCount":7,"hasFarmerSignature":true,"hasStaffSignature":false,"linkedSpecsId":"cmssoffva0001f2ccob2v4mzz"}	\N	2026-08-14 08:22:15.381
cmssoja6t000hf2ccklvvfrbw	cmsifydp10007f2cwf4wbnm6h	chansetha	ADMIN	CREATE	TransportRecord	cmssoja5z000ef2cc5myrrvov	{"driverName":"PHTR","plateNumber":"3A-5555","totalSacks":7,"totalFieldWeight":693,"purchaseCount":1}	\N	2026-08-14 08:22:58.902
\.


--
-- Data for Name: Bank; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Bank" (id, name, code, status, "createdAt") FROM stdin;
cmsifyerd002kf2cw4ta8c4h3	ABA Bank	ABA	ACTIVE	2026-08-07 04:25:06.361
cmsifyerf002lf2cw6v0ax05r	ACLEDA Bank	ACL	ACTIVE	2026-08-07 04:25:06.363
cmsifyerf002mf2cwtlru4bzn	Canadia Bank	CAN	ACTIVE	2026-08-07 04:25:06.364
cmsifyerg002nf2cwjs1ylacp	Sathapana Bank	STP	ACTIVE	2026-08-07 04:25:06.364
cmsifyerg002of2cwoabfp5ko	Wing Bank	WING	ACTIVE	2026-08-07 04:25:06.365
cmsifyerh002pf2cwgj243dvy	PRASAC Microfinance	PRASAC	ACTIVE	2026-08-07 04:25:06.365
cmsifyerh002qf2cw5k6jzdvh	AMK Microfinance	AMK	ACTIVE	2026-08-07 04:25:06.365
cmsifyerh002rf2cw4y46owk6	Hattha Bank	HTB	ACTIVE	2026-08-07 04:25:06.366
cmsifyeri002sf2cwqz02us3p	Campu Bank (Public Bank)	CPB	ACTIVE	2026-08-07 04:25:06.366
\.


--
-- Data for Name: FarmerProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FarmerProfile" (id, "familyCode", "farmerName", village, phone, "paymentMethod", "bankName", "accountNumber", "accountHolder", relationship, "bankDocumentUrl", notes, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmsmy1jil0007f2fobdukj8cf	TB002	TB2	Tmat Paeuy	0897656765	Bank Transfer	ABA Bank	98767890987	TB2	Self	/uploads/doc_1786348949351_vrkc2u.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:02:30.285	2026-08-10 08:02:30.285
cmsmy26b8000bf2fo3m0kuj10	TB003	TB3	Tmat Paeuy	089674523	Bank Transfer	ABA Bank	987678	TB3	Self	/uploads/doc_1786348978420_askihv.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:02:59.828	2026-08-10 08:02:59.828
cmsmy2m3f000ff2foz8nramon	TB004	TB4	Tmat Paeuy	0897654567	Bank Transfer	ABA Bank	09876789	TB4	Self	/uploads/doc_1786348999600_gbouta.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:03:20.283	2026-08-10 08:03:20.283
cmsmy31jj000jf2foee4ewrpc	TB005	TB5	Tmat Paeuy		Bank Transfer	ACLEDA Bank	09876789	TB5	Self	/uploads/doc_1786349017756_crcyjb.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:03:40.303	2026-08-10 08:03:40.303
cmsmy3nxt000nf2fo5lbb4l5v	TB006	TB6	Tmat Paeuy	0987656765	Bank Transfer	ABA Bank	6534231253564	TB6	Self	/uploads/doc_1786349046855_uiykp5.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:04:09.33	2026-08-10 08:04:09.33
cmsmy0py50001f2fo9tg0m75c	TB001	TB1	Tmat Paeuy	0986787656	Bank Transfer	ACLEDA Bank	09876789876	TB2	Husband	/uploads/doc_1786348892049_8nk4hs.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 08:01:51.965	2026-08-10 08:09:07.613
cmsn08bsv001sf23kdsd5i2hf	TB007	TB7	Tmat Paeuy	089765678	Bank Transfer	ABA Bank	987656789	TB7	Self	/uploads/doc_1786352623634_74ysm8.png		cmsifyddo0000f2cw8rymkatf	2026-08-10 09:03:46.111	2026-08-10 09:03:46.111
cmssog6x80005f2cc370pnrnn	AK001	AT1	Andoung Kraloeng	089765645	Bank Transfer	ABA Bank	98765678	AT1	Self	/uploads/doc_1786695628775_zpiqgw.png		cmsifydp10007f2cwf4wbnm6h	2026-08-14 08:20:34.7	2026-08-14 08:20:34.7
\.


--
-- Data for Name: FleetVehicle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FleetVehicle" (id, "plateNumber", "driverName", "driverPhone", "maxWeightKg", status, "createdAt") FROM stdin;
\.


--
-- Data for Name: LocationRegistry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LocationRegistry" (id, name, type, code, address, status, "createdAt") FROM stdin;
cmsifyert0036f2cwp8w76tda	CACC (KPT)	WAREHOUSE	WH-CACC	KPT Central Warehouse	ACTIVE	2026-08-07 04:25:06.378
cmsifyerv0037f2cwq7rq6qek	Amru Nature (KPG)	WAREHOUSE	WH-AMRU	KPG Processing Facility	ACTIVE	2026-08-07 04:25:06.379
cmsifyerv0038f2cw9wbaaa76	Other	WAREHOUSE	WH-OTH	General / Regional Hub	ACTIVE	2026-08-07 04:25:06.38
cmsifyerw0039f2cwcg9ktm3d	Preah Vihear	STATION	ST-PVH	Preah Vihear Regional Station	ACTIVE	2026-08-07 04:25:06.38
cmsifyerx003af2cwsqngb3rf	Stung Treng	STATION	ST-STR	Stung Treng Regional Station	ACTIVE	2026-08-07 04:25:06.381
cmsifyerx003bf2cwi9syxxnd	Ratanakiri	STATION	ST-RAT	Ratanakiri Regional Station	ACTIVE	2026-08-07 04:25:06.382
cmsifyery003cf2cwfjbpqz8n	Mondulkiri	STATION	ST-MDK	Mondulkiri Regional Station	ACTIVE	2026-08-07 04:25:06.382
\.


--
-- Data for Name: PaddyPriceSpec; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaddyPriceSpec" (id, variety, grade, "basePrice", "maxMoisture", "maxForeignMatter", "minWholeGrain", "maxBrokenRice", status, "createdAt", "updatedAt", impurity, "moistureRange") FROM stdin;
cmsifyers0034f2cwmgy6ipqa	White Rice	A	1320	13.5	4	\N	\N	ACTIVE	2026-08-07 04:25:06.377	2026-08-11 07:16:32.738	\N	13 - 14
cmsifyert0035f2cw50s72vxz	White Rice	B	1220	13.5	8	\N	\N	ACTIVE	2026-08-07 04:25:06.377	2026-08-11 07:16:32.738	\N	13 - 14
cmsifyerj002tf2cwczj2mlrn	Phka Rumduol	A1	1650	13.5	6	75	25	ACTIVE	2026-08-07 04:25:06.367	2026-08-11 07:16:32.729	2	13 - 14
cmsifyerl002uf2cws88j0u49	Phka Rumduol	A2	1550	14	6	70	30	ACTIVE	2026-08-07 04:25:06.37	2026-08-11 07:16:32.73	4	13 - 15
cmsifyerm002vf2cwuq8xdusi	Phka Rumduol	B1	1500	14	6	60	40	ACTIVE	2026-08-07 04:25:06.37	2026-08-11 07:16:32.731	2	13 - 15
cmsifyern002wf2cwvlj8j73t	Phka Rumduol	B2	1450	14	6	50	50	ACTIVE	2026-08-07 04:25:06.371	2026-08-11 07:16:32.732	4	13 - 15
cmsifyern002xf2cwhbqdh7iq	Red Jasmine	A1	1850	13.5	6	75	25	ACTIVE	2026-08-07 04:25:06.372	2026-08-11 07:16:32.733	\N	13 - 14
cmsifyero002yf2cwny5dc199	Red Jasmine	A2	1750	14	6	70	30	ACTIVE	2026-08-07 04:25:06.373	2026-08-11 07:16:32.734	\N	13 - 15
cmsifyerp002zf2cw5kzl1fy9	Red Jasmine	B1	1700	14	6	60	40	ACTIVE	2026-08-07 04:25:06.373	2026-08-11 07:16:32.734	\N	13 - 15
cmsifyerq0030f2cwlh3lf4iv	Red Jasmine	B2	1650	14	6	50	50	ACTIVE	2026-08-07 04:25:06.374	2026-08-11 07:16:32.735	\N	13 - 15
cmsifyerr0032f2cw6h64pqki	Foundation Seed - Red Jasmine	A	2150	12	1	98	\N	ACTIVE	2026-08-07 04:25:06.375	2026-08-11 07:16:32.736	1	11 - 13
cmsifyerq0031f2cw53tzwq2y	Foundation Seed - Phka Rumduol	A	2050	12	1	98	\N	ACTIVE	2026-08-07 04:25:06.375	2026-08-11 07:16:32.736	1	11 - 13
cmsifyers0033f2cw2jit6yru	Certified Seed	A	1900	12	2	96	\N	ACTIVE	2026-08-07 04:25:06.376	2026-08-11 07:16:32.737	2	11 - 13
\.


--
-- Data for Name: PurchaseItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseItem" (id, "purchaseId", variety, grade, "standardPrice", "additionalPrice", "finalPrice", sacks, quantity, "totalValue", "sackWeights") FROM stdin;
cmsmy6opw000zf2fo6kojl7kf	cmsmy6opw000yf2fo329iw156	Red Jasmine	A1	1850	0	1850	7	630	1165500	[90,90,90,90,90,90,90]
cmsmy76ay0014f2fopas4z0j9	cmsmy76ay0013f2fo015p0y54	White Rice	B	1220	0	1220	6	588	717360	[98,98,98,98,98,98]
cmsmy7w6k0019f2foc7b0gwxo	cmsmy7w6j0018f2fol7gmu6vh	Certified Seed	A	1900	100	2000	7	686	1372000	[98,98,98,98,98,98,98]
cmsmy8erg001ef2fohr2i4ai2	cmsmy8erg001df2focx7h5elu	Foundation Seed - Phka Rumduol	A	2050	0	2050	6	538	1102900	[90,98,98,78,87,87]
cmsmy8wh9001jf2fotybaqkxd	cmsmy8wh9001if2fo130suqey	Foundation Seed - Red Jasmine	A	2150	0	2150	7	615	1322250	[89,89,87,87,87,87,89]
cmsmzarg30004f23ki0etdtg9	cmsmzarg20003f23kacrpwjnn	Phka Rumduol	A2	1550	0	1550	9	810	1255500	[90,90,90,90,90,90,90,90,90]
cmssoicli000af2ccwzpcxjbq	cmssoicli0009f2cctw1uburt	Phka Rumduol	A1	1650	50	1700	7	693	1178100	[99,99,99,99,99,99,99]
\.


--
-- Data for Name: PurchaseRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PurchaseRecord" (id, date, "familyCode", "farmerName", village, "totalWeight", "totalPayment", "seedBorrowed", "seedRepayment", "seedDeduction", "additionalPremium", "netPayment", "signatureFarmer", "signatureStaff", "purchasingStaffId", "purchasingStaffName", "specsRecordId", "transportRecordId", status, "createdBy", "createdAt", "updatedAt") FROM stdin;
cmsmy6opw000yf2fo329iw156	2026-08-10 08:06:30.308	TB002	TB2	Tmat Paeuy	630	1165500	0	0	0	0	1165500	/uploads/sig_farmer_1786349190305_7gdbeh.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxq9qr0005f2xwr2grt4us	cmsmyhj9s001rf2fo6akwm1mw	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:06:30.308	2026-08-10 08:26:24.038
cmsmy76ay0013f2fo015p0y54	2026-08-10 08:06:53.098	TB003	TB3	Tmat Paeuy	588	717360	10	11	13420	0	703940	/uploads/sig_farmer_1786349213095_vbeph7.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxqld10009f2xwm7l7i9tv	cmsmyhj9s001rf2fo6akwm1mw	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:06:53.098	2026-08-10 08:26:24.038
cmsmy8erg001df2focx7h5elu	2026-08-10 08:07:50.716	TB005	TB5	Tmat Paeuy	538	1102900	20	22	45100	0	1057800	/uploads/sig_farmer_1786349270713_yv4vfn.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxrdeg000hf2xw6gep3gep	cmsmzcq0u0008f23kxm6n69ba	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:07:50.716	2026-08-10 08:48:09.319
cmsmy8wh9001if2fo130suqey	2026-08-10 08:08:13.678	TB006	TB6	Tmat Paeuy	615	1322250	0	0	0	0	1322250	/uploads/sig_farmer_1786349293675_abhnva.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxrs3t000lf2xwqbpo7w10	cmsmzcq0u0008f23kxm6n69ba	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:08:13.678	2026-08-10 08:48:09.319
cmsmy7w6j0018f2fol7gmu6vh	2026-08-10 08:07:26.636	TB004	TB4	Tmat Paeuy	686	1372000	0	0	0	0	1372000	/uploads/sig_farmer_1786349246634_zxvcpb.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxqxg8000df2xwi57xyecd	cmsmzcq0u0008f23kxm6n69ba	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:07:26.636	2026-08-10 08:48:09.319
cmsmzarg20003f23kacrpwjnn	2026-08-10 08:37:40.083	TB001	TB1	Tmat Paeuy	810	1255500	0	0	0	0	1255500	/uploads/sig_farmer_1786351060079_vt80zv.png	\N	cmsifyddo0000f2cw8rymkatf	piseth	cmsmxpuoo0001f2xw37tl26dx	cmsmzcq0u0008f23kxm6n69ba	DISBURSED	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:37:40.083	2026-08-10 08:48:09.319
cmssoicli0009f2cctw1uburt	2026-08-14 08:22:15.366	AK001	AT1	Andoung Kraloeng	693	1178100	20	22	37400	50	1140700	/uploads/sig_farmer_1786695735357_zkzald.png	\N	cmsifydp10007f2cwf4wbnm6h	chansetha	cmssoffva0001f2ccob2v4mzz	cmssoja5z000ef2cc5myrrvov	IN_TRANSIT	cmsifydp10007f2cwf4wbnm6h	2026-08-14 08:22:15.366	2026-08-14 08:22:58.89
\.


--
-- Data for Name: RejectionLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RejectionLog" (id, "entityType", "entityId", "targetModule", "rejectedBy", "rejectedByName", "rejectedByRole", reason, status, "createdAt", "resolvedAt", "resolvedByName") FROM stdin;
cmsmzdlk8000gf23kqu1rsst6	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	FIELD	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	Check Invoice	RESOLVED	2026-08-10 08:39:52.423	2026-08-10 08:41:13.387	piseth
cmsmzhk87000uf23kcm6if88x	WarehouseIntake	cmsmzgjp2000qf23kwqxnlbq6	WAREHOUSE	cmsifyehs000pf2cwvxi4y29e	bousong	INVENTORY	check weigh invoice	RESOLVED	2026-08-10 08:42:57.319	2026-08-10 08:44:08.633	piseth
cmsmzihuu000yf23kdyoqvo32	TransportRecord	cmsmzcq0u0008f23kxm6n69ba	FIELD	cmsifyeg6000of2cwfhx5zj37	phearun	WAREHOUSE	check invoice	RESOLVED	2026-08-10 08:43:40.901	2026-08-10 08:44:08.633	piseth
cmsmzl2p5001ef23kyzo0f1h8	WarehouseIntake	cmsmzjzew0018f23kpxj9ix51	INVENTORY	cmsifydvh000bf2cwhogdwe5v	heap	FINANCE	chek not book	RESOLVED	2026-08-10 08:45:41.225	2026-08-10 08:46:54.434	bousong
\.


--
-- Data for Name: SpecsRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SpecsRecord" (id, date, "familyCode", "farmerName", village, "paddyType", "selectedGrade", "isOrganic", moisture, "foreignMatter", purity, impurity, "wholeGrain", "brokenRice", "isValid", "basePrice", "finalPrice", "bestQualifyingGrade", "createdBy", "createdAt") FROM stdin;
cmsmxpuoo0001f2xw37tl26dx	2026-08-10 07:53:24.888	TB001	TB1	Tmat Paeuy	Phka Rumduol	A2	t	14	6	\N	4	70	30	t	1550	1550	A2	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:53:24.888
cmsmxq9qr0005f2xwr2grt4us	2026-08-10 07:53:44.403	TB002	TB2	Tmat Paeuy	Red Jasmine	A1	t	13.5	6	\N	\N	75	25	t	1850	1850	A1	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:53:44.403
cmsmxqld10009f2xwm7l7i9tv	2026-08-10 07:53:59.462	TB003	TB3	Tmat Paeuy	White Rice	B	t	13.5	8	\N	\N	\N	\N	t	1220	1220	B	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:53:59.462
cmsmxqxg8000df2xwi57xyecd	2026-08-10 07:54:15.128	TB004	TB4	Tmat Paeuy	Certified Seed	A	t	12	2	\N	2	96	\N	t	1900	1900	A	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:54:15.128
cmsmxrdeg000hf2xw6gep3gep	2026-08-10 07:54:35.801	TB005	TB5	Tmat Paeuy	Foundation Seed - Phka Rumduol	A	t	12	1	\N	1	98	\N	t	2050	2050	A	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:54:35.801
cmsmxrs3t000lf2xwqbpo7w10	2026-08-10 07:54:54.857	TB006	TB6	Tmat Paeuy	Foundation Seed - Red Jasmine	A	t	12	1	\N	1	98	\N	t	2150	2150	A	cmsifyddo0000f2cw8rymkatf	2026-08-10 07:54:54.857
cmsn07sk0001of23kgumhbm2m	2026-08-10 09:03:21.168	TB007	TB7	Tmat Paeuy	Phka Rumduol	A1	t	13.5	6	\N	2	75	25	t	1650	1650	A1	cmsifyddo0000f2cw8rymkatf	2026-08-10 09:03:21.168
cmssoffva0001f2ccob2v4mzz	2026-08-14 08:19:59.637	AK001	AT1	Andoung Kraloeng	Phka Rumduol	A1	t	13.5	6	\N	2	75	25	t	1650	1650	A1	cmsifydp10007f2cwf4wbnm6h	2026-08-14 08:19:59.637
\.


--
-- Data for Name: SystemSetting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SystemSetting" (id, key, value, "updatedAt") FROM stdin;
cmsifyery003df2cw2grwv384	SCALE_TOLERANCE_PERCENT	1.5	2026-08-11 07:16:32.743
\.


--
-- Data for Name: TransportLot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransportLot" (id, "transportId", variety, "familyCode", "farmerName", village, sacks, weight, "purchaseRecordId") FROM stdin;
cmsmyibdt001xf2fow52m6utd	cmsmyhj9s001rf2fo6akwm1mw	Red Jasmine	TB002	TB2	Tmat Paeuy	7	630	cmsmy6opw000yf2fo329iw156
cmsmyibdt001yf2fo0aohlc2u	cmsmyhj9s001rf2fo6akwm1mw	White Rice	TB003	TB3	Tmat Paeuy	6	588	cmsmy76ay0013f2fo015p0y54
cmsmzj3900011f23kuf7vlxhr	cmsmzcq0u0008f23kxm6n69ba	Foundation Seed - Phka Rumduol	TB005	TB5	Tmat Paeuy	6	538	cmsmy8erg001df2focx7h5elu
cmsmzj3900012f23kz7a7gb0g	cmsmzcq0u0008f23kxm6n69ba	Foundation Seed - Red Jasmine	TB006	TB6	Tmat Paeuy	7	615	cmsmy8wh9001if2fo130suqey
cmsmzj3900013f23k1bfujkud	cmsmzcq0u0008f23kxm6n69ba	Certified Seed	TB004	TB4	Tmat Paeuy	7	686	cmsmy7w6j0018f2fol7gmu6vh
cmsmzj3900014f23kjdj6zmj4	cmsmzcq0u0008f23kxm6n69ba	Phka Rumduol	TB001	TB1	Tmat Paeuy	9	810	cmsmzarg20003f23kacrpwjnn
cmssoja5z000ff2cc56psdn2j	cmssoja5z000ef2cc5myrrvov	Phka Rumduol	AK001	AT1	Andoung Kraloeng	7	693	cmssoicli0009f2cctw1uburt
\.


--
-- Data for Name: TransportRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."TransportRecord" (id, date, "driverName", "plateNumber", "mobileNumber", "truckCleaned", "fieldStaffName", "fieldStaffDate", "fieldStaffTime", "driverWitnessName", "driverWitnessDate", "driverWitnessTime", "loadingLocation", "destinationWarehouse", notes, "totalSacks", "totalFieldWeight", status, "paymentReceiptUrl", "paymentMethod", "paymentBatchNumber", "paidAt", "paidByStaffName", "createdBy", "createdAt", "truckPhotoUrl", "driverSignature") FROM stdin;
cmsmyhj9s001rf2fo6akwm1mw	2026-08-10 08:14:56.464	Tansporter_1	3A-8967	09876676	t	piseth	2026-08-10	03:14 PM	\N	\N	\N	Tmat Paeuy	CACC (KPT)		13	1218	DISBURSED	/uploads/doc_1786350381916_brq2m8.png	ABA Bulk Transfer	BATCH-20260810	2026-08-10 08:26:24.031	heap	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:14:56.464	\N	\N
cmsmzcq0u0008f23kxm6n69ba	2026-08-10 08:39:11.55	Transporter_2	3A-8888	089765423	t	piseth	2026-08-10	03:39 PM	\N	\N	\N	Tmat Paeuy	Amru Nature (KPG)		29	2649	DISBURSED	/uploads/doc_1786351688385_iqm4ui.png	ABA Bulk Transfer	BATCH-20260810	2026-08-10 08:48:09.309	heap	cmsifyddo0000f2cw8rymkatf	2026-08-10 08:39:11.55	\N	\N
cmssoja5z000ef2cc5myrrvov	2026-08-14 08:22:58.871	PHTR	3A-5555	0897656765	t	chansetha	2026-08-14	03:22 PM	\N	\N	\N	Andoung Kraloeng	CACC (KPT)	\N	7	693	EN_ROUTE	\N	\N	\N	\N	\N	cmsifydp10007f2cwf4wbnm6h	2026-08-14 08:22:58.871	\N	\N
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, "assignedProvinces", status, "lastLogin", "createdAt", "updatedAt") FROM stdin;
cmsifydyn000df2cw1yxsm93b	vongrith	vongrith@ibisrice.com	$2b$10$6rGQthjzCLXwKKYKcTRVHualG8Y4IzsgK2..FwgNP6V2rENg6i1BK	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.327	2026-08-11 07:16:31.735
cmsifye87000jf2cwn0jcuvpr	tong	tong@ibisrice.com	$2b$10$UhwFJ8M.XzgtAkOp3zHpa.fV8jBZAUhjdKKMJZegQEFrTJ97/04ca	FIELD	Mondolkiri	ACTIVE	\N	2026-08-07 04:25:05.671	2026-08-11 07:16:32.072
cmsifye07000ef2cw5tf31pn9	samath	samath@ibisrice.com	$2b$10$quRxy2igN4CxtMNUmvm9guVNatPHGMoAlUbYNizNAGypOg0w6p4VC	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.383	2026-08-11 07:16:31.791
cmsifydfd0001f2cwo83c6wtq	chandara	chandara@ibisrice.com	$2b$10$rRmnW8oy/3ZIxuwFnbKBWOGZlVs5xkXpYp3aBa6Lp.APySbl4Kx.u	FIELD	Preah Vihear	ACTIVE	\N	2026-08-07 04:25:04.633	2026-08-11 07:16:31.053
cmsifye9r000kf2cwmi09obre	sokmen	sokmen@ibisrice.com	$2b$10$EMWmD6H4ybd3MxbzX/X8AelMU29.Ir3LtRPMoIVkMkjswWXsS2equ	FIELD	Mondolkiri	ACTIVE	\N	2026-08-07 04:25:05.728	2026-08-11 07:16:32.128
cmsifyebc000lf2cwo3wukjl3	vimean	vimean@ibisrice.com	$2b$10$a4sqb3C1FWI0JOP5lAXwdO9j6dNlikAcABwtxeShq5OxZTYlzxtAi	FIELD	Mondolkiri	ACTIVE	\N	2026-08-07 04:25:05.785	2026-08-11 07:16:32.183
cmsifyecy000mf2cwccaw4j2b	chantha	chantha@ibisrice.com	$2b$10$YhHjT8WZ3ZJXbl8H//5FWO51WNERqabRhOiIZp7CfG41WedHKi6.i	FIELD	Mondolkiri	ACTIVE	\N	2026-08-07 04:25:05.842	2026-08-11 07:16:32.24
cmsifye1w000ff2cw6o1x168e	kimly	kimly@ibisrice.com	$2b$10$spgRodN5nZFi5gwQ5iyLT.Sl/.0wItYT7BF8NrZIDfJQs4t73rK3.	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.444	2026-08-11 07:16:31.847
cmsifyehs000pf2cwvxi4y29e	bousong	bousong@ibisrice.com	$2b$10$seBaXn6q9d4F.rvDefDin.RYWdGo4wl8RvZM8SykzTd.o8GDQ.5y.	INVENTORY	Phnom Penh	ACTIVE	2026-08-10 08:47:22.069	2026-08-07 04:25:06.016	2026-08-11 07:16:32.41
cmsifyejc000qf2cwcsg0n0jo	admin	admin@ibisrice.com	$2b$10$Wh7GfSsw02LSI/8EosMaGOPyhlSWHiD3xXb.7lzWHkPbIq2TzUcPq	ADMIN	Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri	ACTIVE	\N	2026-08-07 04:25:06.072	2026-08-11 07:16:32.466
cmsifyel4000rf2cwjdwwy488	field	field@ibisrice.com	$2b$10$p3FLn/RmYO19tLD0dV/HNO54RjzES4SVMTghbWQrF8tiiE9pfHR6C	FIELD	Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri	ACTIVE	\N	2026-08-07 04:25:06.136	2026-08-11 07:16:32.522
cmsifyemt000sf2cwmlp3gaec	warehouse	warehouse@ibisrice.com	$2b$10$1RgC7/NeCTKnMqivylxGVuC2LygVQEQGkm96K/owgHDBF/jHFjCGO	WAREHOUSE	Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri	ACTIVE	\N	2026-08-07 04:25:06.197	2026-08-11 07:16:32.577
cmsifydh00002f2cwzn5f6hpx	chin	chin@ibisrice.com	$2b$10$LDUHRLsGU3zggGFw6T7IO.g0yH5QKJE3jIkhQ63iSlIncj4nTl.yi	FIELD	Preah Vihear	ACTIVE	\N	2026-08-07 04:25:04.692	2026-08-11 07:16:31.11
cmsifye3h000gf2cwei3pkdqy	sreypov	sreypov@ibisrice.com	$2b$10$cIOsRQu48SU3WfzezAK7iuaBA5K.cXJ0MvXFwUT1ZAJW2cxhBVAC2	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.502	2026-08-11 07:16:31.903
cmsifyeqa000uf2cw5cy73l3h	finance	finance@ibisrice.com	$2b$10$MihuRZ8mpsmy1TEDVP3pvebqWg.Lq/teCeFFGaUZTOgSfUwXR4sMu	FINANCE	Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri	ACTIVE	\N	2026-08-07 04:25:06.322	2026-08-11 07:16:32.689
cmsifydp10007f2cwf4wbnm6h	chansetha	chansetha@ibisrice.com	$2b$10$V/vOgfv8y.GL3rtIiCCJ/ucfcWesLzxGVPI/PPzXoIRtbry32rPNu	ADMIN	Stung Treng	ACTIVE	2026-08-11 07:18:24.409	2026-08-07 04:25:04.981	2026-08-11 07:18:24.413
cmsifydil0003f2cwwzvt10ve	sokunrath	sokunrath@ibisrice.com	$2b$10$TL3/7boVz8A18xxMsOWToefGPIT7oPMvYQ98QCmll31CQ0ZDDbZye	FIELD	Preah Vihear	ACTIVE	\N	2026-08-07 04:25:04.749	2026-08-11 07:16:31.167
cmsifyeoe000tf2cwiq5rxknr	inventory	inventory@ibisrice.com	$2b$10$9seNF3hGwHzLp9izFVXkPu9nn0NVJ9Oz50VOe4gnimYNunaFH8Mui	INVENTORY	Preah Vihear,Stung Treng,Ratanakiri,Mondulkiri	ACTIVE	\N	2026-08-07 04:25:06.255	2026-08-11 07:16:32.633
cmsifydk70004f2cwomtv6q0i	vornne	vornne@ibisrice.com	$2b$10$x0cD0N8ZMbbmkklcySttkeZh4gn2/T2XvC5qDidnDQZ.TqXRRSgzi	FIELD	Preah Vihear	ACTIVE	\N	2026-08-07 04:25:04.807	2026-08-11 07:16:31.224
cmsifydlt0005f2cwjox7yuwc	sokun	sokun@ibisrice.com	$2b$10$Tj1ROZNPZGOStdRuyJ5UveG9WxzWZNvgZpozRqz1ihSgcEAwHYl3G	FIELD	Preah Vihear	ACTIVE	2026-08-09 08:17:54.463	2026-08-07 04:25:04.865	2026-08-11 07:16:31.281
cmsifye52000hf2cwdf89hh60	thearith	thearith@ibisrice.com	$2b$10$fXZac/JaI.gyAAZaYxw.qummRsEo0oswINFEvMQ7uGIc7FG8pfNrS	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.558	2026-08-11 07:16:31.959
cmsifydqq0008f2cweuvtjsb2	theavy	theavy@ibisrice.com	$2b$10$KHB2lcggFRLVyIn1EXf6VOtLEMv1q/rsMsa39qskYpQ0nHIiuUSva	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.042	2026-08-11 07:16:31.454
cmsifydsb0009f2cwym7mhelz	samol	samol@ibisrice.com	$2b$10$wIeNrEN7zEfPEU85dlIPuuuQfnRXzgqyQoRHJFfocOhZN0.fpMkZK	FIELD	Stung Treng	ACTIVE	2026-08-07 07:21:55.579	2026-08-07 04:25:05.099	2026-08-11 07:16:31.512
cmsifydtv000af2cw52c715ce	yornthy	yornthy@ibisrice.com	$2b$10$Nvx84.vUiTeXzNGZvRuhauiqPSJQDC9MW0CM6Uv5SUNTfbm1v9Qie	FIELD	Stung Treng	ACTIVE	\N	2026-08-07 04:25:05.156	2026-08-11 07:16:31.568
cmsifydvh000bf2cwhogdwe5v	heap	heap@ibisrice.com	$2b$10$C5AE1YGDCkBCxG.xMHjvxep5SOyjPHxEc3ie0bdGSmCyoBPupLl66	FINANCE	Stung Treng	ACTIVE	2026-08-10 08:47:48.201	2026-08-07 04:25:05.213	2026-08-11 07:16:31.623
cmsifydx1000cf2cwbge3bo48	kalayan	kalayan@ibisrice.com	$2b$10$DF42th1.oQQu1Sub1ogev.toJ57DCVFh1auJAp9RjqJZQECDBZ0Xu	FIELD	Stung Treng	ACTIVE	2026-08-10 09:08:01.054	2026-08-07 04:25:05.27	2026-08-11 07:16:31.679
cmsifyddo0000f2cw8rymkatf	piseth	piseth@ibisrice.com	$2b$10$ay7UpvjR4ViKeKFk5IShkOwTeOZCdVvfohsLjJbO1VTucJZ3eUbzG	FIELD	Preah Vihear	ACTIVE	2026-08-10 09:43:07.084	2026-08-07 04:25:04.572	2026-08-11 07:16:30.981
cmsifye6m000if2cwuqb11hkx	sombath	sombath@ibisrice.com	$2b$10$BuJhDCcVejXcx50uuGbLsedI5tpXdi7Dm.L82jE.LfL.Dx6aGDK6q	FIELD	Ratanakiri	ACTIVE	\N	2026-08-07 04:25:05.615	2026-08-11 07:16:32.015
cmsifydng0006f2cwb0bd4vqd	vuthy	vuthy@ibisrice.com	$2b$10$oLjI0TV1CKMbdSjIcBF9ruyAlwNuZ0aiO4V8TmXjRV2E2ydXqZpEe	FIELD	Preah Vihear	ACTIVE	\N	2026-08-07 04:25:04.924	2026-08-11 07:16:31.338
cmsifyeel000nf2cw9rlv9tqr	thana	thana@ibisrice.com	$2b$10$RhBIUVhbVLipDYabWnZ00ec.S6RF4wJAusIcsdQQFOkrUwz/0kVqW	FIELD	Mondolkiri	ACTIVE	\N	2026-08-07 04:25:05.902	2026-08-11 07:16:32.297
cmsifyeg6000of2cwfhx5zj37	phearun	phearun@ibisrice.com	$2b$10$6J.3uICN/xoVZKU/KMcc0eQ3HsOhF2qB0ev5423z1rCUq6wKXzjBS	WAREHOUSE	Kampong Thom	ACTIVE	2026-08-10 08:46:59.212	2026-08-07 04:25:05.959	2026-08-11 07:16:32.353
\.


--
-- Data for Name: Village; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Village" (id, name, code, district, province, status, "createdAt") FROM stdin;
cmsifyeqt001jf2cwit788b8b	Kham Phouk	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.341
cmsifyeqt001kf2cw0dq4xtcc	Phum Lun	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.342
cmsifyequ001lf2cw0bahmzzg	Ban Moung	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.342
cmsifyequ001mf2cwfnyu924l	Samor	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.343
cmsifyeqv001nf2cw3smmq0wi	Chantu	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.343
cmsifyeqv001of2cwxeudybol	Keng Nhai	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.344
cmsifyeqw001pf2cw14893epe	Siem Pang	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.344
cmsifyeqx001rf2cwq79noh5p	Peam Khes	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.345
cmsifyeqx001sf2cw92zjuyai	Srae Russei	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.346
cmsifyeqy001tf2cwpm97oe0r	Kanchanh Kouk	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.346
cmsifyeqz001uf2cw8kndgugq	Teteam	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.347
cmsifyeqz001vf2cwnvyqon8n	O'Chay	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.348
cmsifyer0001wf2cwpu2slzg5	Nhang Sum	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.348
cmsifyer0001xf2cwexetj64k	La Kay	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.349
cmsifyer1001yf2cwvnhtq0bn	Pha Bang	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.349
cmsifyer1001zf2cw7cjwpo6d	I-Tub	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.35
cmsifyer20020f2cwi8a64fe1	Bak Kae	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.35
cmsifyer20021f2cw9qcr3888	Korng Nork	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.351
cmsifyer30022f2cwxgvq3vh3	Kalan	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.351
cmsifyer30023f2cwpx4whtxu	Srae Pokthom	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.352
cmsifyer40024f2cwhrt3lr2i	Thmey	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.352
cmsifyer40025f2cw0ybdp5m6	Srae Chhuk	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.353
cmsifyer50026f2cwi0gvuk27	Srae Poktoch	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.353
cmsifyer60028f2cwhm0a8iqy	Roveak	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.354
cmsifyer70029f2cws8r5w5ty	Pu Char	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.355
cmsifyer7002af2cwk6xh5bcp	Pu Kung	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.356
cmsifyer8002bf2cw2squl4y0	Ou Chra	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.356
cmsifyer9002cf2cwssopknbp	Andoung Kraloeng	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.357
cmsifyer9002df2cwt4o87qn0	Srae Lvi	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.358
cmsifyera002ef2cwfbvtos05	Gati	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.358
cmsifyera002ff2cwhrym8nju	Pu Trom	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.359
cmsifyerb002hf2cwkxog9vfd	Sre Andaol	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.36
cmsifyerc002if2cw1mmkp7rc	Kmoum	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.36
cmsifyerc002jf2cwmrv1sm8d	Ktung	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.361
cmsifyeqb000vf2cw38d4rw7i	Prey Veng	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.324
cmsifyeqe000wf2cw4quqteyk	Sambou	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.326
cmsifyeqe000xf2cw0s1qhd47	Koh Ker	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.327
cmsifyeqf000yf2cwt6cegwt2	Damnak Kantout	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.328
cmsifyeqg000zf2cwhhx3rnwx	Dan	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.329
cmsifyeqh0010f2cwx6d94hch	Pongro	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.33
cmsifyeqi0011f2cwsiowstbz	Kampenh	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.331
cmsifyeqj0012f2cwkc0eed8u	Yeang	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.331
cmsifyeqj0013f2cw0i9pk2xj	Kong Yoang	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.332
cmsifyeqk0014f2cwzbwqxe7c	Tmat Paeuy	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.333
cmsifyeql0015f2cw1z5ffp8k	Krala Peas	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.333
cmsifyeqm0016f2cw0wu0zveo	Dang Phlet	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.334
cmsifyeqm0017f2cwu3phq139	Narong	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.335
cmsifyeqn0018f2cwsgrfnwju	Bra	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.335
cmsifyeqn0019f2cwv21s4c9f	Soung	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.336
cmsifyeqo001af2cw706gp817	Kham Keut	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.336
cmsifyeqp001bf2cweqe6axhj	Kampong Sangkae	\N	Chhaeb	Preah Vihear	ACTIVE	2026-08-07 04:25:06.337
cmsifyeqp001cf2cwk05hf83i	Doung	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.338
cmsifyeqq001df2cwi3gfsdxi	Kes	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.338
cmsifyeqq001ef2cwk5224btq	Kang Cham	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.339
cmsifyeqr001ff2cwjhfmr3ud	Kang Kngaok	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.339
cmsifyeqr001gf2cwfuedc9yr	Khes Kroam	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.34
cmsifyeqs001hf2cwwyikr1k5	Khes Svay	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.34
cmsifyeqs001if2cwpk2ur6xl	Pong Kriel	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.341
cmsifyeqw001qf2cwwxx8fkg0	Dan Loung	\N	Siem Pang	Stung Treng	ACTIVE	2026-08-07 04:25:06.345
cmsifyer50027f2cwufkgt4m6	Srae Chrey	\N	Taveng	Ratanakiri	ACTIVE	2026-08-07 04:25:06.354
cmsifyerb002gf2cwuq3z7cyx	Chokchar	\N	Sen Monorom	Mondulkiri	ACTIVE	2026-08-07 04:25:06.359
\.


--
-- Data for Name: WarehouseIntake; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."WarehouseIntake" (id, "transportId", "arrivalTime", "warehouseGrossWeight", "warehouseTareWeight", "warehouseNetWeight", "weightDiffKg", "weightDiffPercent", "grossScalePhotoUrl", "tareScalePhotoUrl", "transportInvoiceUrl", "receivingStaffId", "receivingStaffName", notes, "inventoryStatus", "inventoryStaffId", "inventoryStaffName", "inventoryConfirmedAt", "inventoryLocation", "inventoryNotes", status, "createdAt") FROM stdin;
cmsmyqess0022f2foeytytfp9	cmsmyhj9s001rf2fo6akwm1mw	2026-08-10 08:21:50.573	1318	100	1218	0	0	/uploads/doc_1786350098485_gnogbp.png	/uploads/doc_1786350100528_s56nsl.png	/uploads/doc_1786350102535_nh5be8.png	cmsifyeg6000of2cwfhx5zj37	phearun	\N	INVENTORY_RECORDED	cmsifyehs000pf2cwvxi4y29e	bousong	2026-08-10 08:24:38.089	To Lot ABC	All are recorded in Unleash	RECEIVED	2026-08-10 08:21:50.573
cmsmzjzew0018f23kpxj9ix51	cmsmzcq0u0008f23kxm6n69ba	2026-08-10 08:44:50.312	2750	100	2650	1	0.04	/uploads/doc_1786351465471_03tecw.png	/uploads/doc_1786351467274_xuxo4g.png	/uploads/doc_1786351471787_pf7k5d.png	cmsifyeg6000of2cwfhx5zj37	phearun	\N	INVENTORY_RECORDED	cmsifyehs000pf2cwvxi4y29e	bousong	2026-08-10 08:46:54.415	Silo 01 - Stack A	check	RECEIVED	2026-08-10 08:44:50.312
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Bank Bank_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bank"
    ADD CONSTRAINT "Bank_pkey" PRIMARY KEY (id);


--
-- Name: FarmerProfile FarmerProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FarmerProfile"
    ADD CONSTRAINT "FarmerProfile_pkey" PRIMARY KEY (id);


--
-- Name: FleetVehicle FleetVehicle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FleetVehicle"
    ADD CONSTRAINT "FleetVehicle_pkey" PRIMARY KEY (id);


--
-- Name: LocationRegistry LocationRegistry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LocationRegistry"
    ADD CONSTRAINT "LocationRegistry_pkey" PRIMARY KEY (id);


--
-- Name: PaddyPriceSpec PaddyPriceSpec_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaddyPriceSpec"
    ADD CONSTRAINT "PaddyPriceSpec_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseItem PurchaseItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY (id);


--
-- Name: PurchaseRecord PurchaseRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseRecord"
    ADD CONSTRAINT "PurchaseRecord_pkey" PRIMARY KEY (id);


--
-- Name: RejectionLog RejectionLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RejectionLog"
    ADD CONSTRAINT "RejectionLog_pkey" PRIMARY KEY (id);


--
-- Name: SpecsRecord SpecsRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpecsRecord"
    ADD CONSTRAINT "SpecsRecord_pkey" PRIMARY KEY (id);


--
-- Name: SystemSetting SystemSetting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SystemSetting"
    ADD CONSTRAINT "SystemSetting_pkey" PRIMARY KEY (id);


--
-- Name: TransportLot TransportLot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransportLot"
    ADD CONSTRAINT "TransportLot_pkey" PRIMARY KEY (id);


--
-- Name: TransportRecord TransportRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransportRecord"
    ADD CONSTRAINT "TransportRecord_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Village Village_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Village"
    ADD CONSTRAINT "Village_pkey" PRIMARY KEY (id);


--
-- Name: WarehouseIntake WarehouseIntake_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WarehouseIntake"
    ADD CONSTRAINT "WarehouseIntake_pkey" PRIMARY KEY (id);


--
-- Name: Bank_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Bank_name_key" ON public."Bank" USING btree (name);


--
-- Name: FarmerProfile_familyCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FarmerProfile_familyCode_idx" ON public."FarmerProfile" USING btree ("familyCode");


--
-- Name: FarmerProfile_farmerName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FarmerProfile_farmerName_idx" ON public."FarmerProfile" USING btree ("farmerName");


--
-- Name: FleetVehicle_plateNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FleetVehicle_plateNumber_key" ON public."FleetVehicle" USING btree ("plateNumber");


--
-- Name: LocationRegistry_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LocationRegistry_name_key" ON public."LocationRegistry" USING btree (name);


--
-- Name: PaddyPriceSpec_variety_grade_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PaddyPriceSpec_variety_grade_key" ON public."PaddyPriceSpec" USING btree (variety, grade);


--
-- Name: PurchaseRecord_familyCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PurchaseRecord_familyCode_idx" ON public."PurchaseRecord" USING btree ("familyCode");


--
-- Name: PurchaseRecord_farmerName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PurchaseRecord_farmerName_idx" ON public."PurchaseRecord" USING btree ("farmerName");


--
-- Name: RejectionLog_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RejectionLog_entityType_entityId_idx" ON public."RejectionLog" USING btree ("entityType", "entityId");


--
-- Name: SpecsRecord_familyCode_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SpecsRecord_familyCode_idx" ON public."SpecsRecord" USING btree ("familyCode");


--
-- Name: SpecsRecord_farmerName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SpecsRecord_farmerName_idx" ON public."SpecsRecord" USING btree ("farmerName");


--
-- Name: SystemSetting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SystemSetting_key_key" ON public."SystemSetting" USING btree (key);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Village_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Village_name_key" ON public."Village" USING btree (name);


--
-- Name: WarehouseIntake_transportId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "WarehouseIntake_transportId_key" ON public."WarehouseIntake" USING btree ("transportId");


--
-- Name: AuditLog AuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FarmerProfile FarmerProfile_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FarmerProfile"
    ADD CONSTRAINT "FarmerProfile_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseItem PurchaseItem_purchaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseItem"
    ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES public."PurchaseRecord"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PurchaseRecord PurchaseRecord_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseRecord"
    ADD CONSTRAINT "PurchaseRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PurchaseRecord PurchaseRecord_transportRecordId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PurchaseRecord"
    ADD CONSTRAINT "PurchaseRecord_transportRecordId_fkey" FOREIGN KEY ("transportRecordId") REFERENCES public."TransportRecord"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RejectionLog RejectionLog_rejectedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RejectionLog"
    ADD CONSTRAINT "RejectionLog_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SpecsRecord SpecsRecord_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpecsRecord"
    ADD CONSTRAINT "SpecsRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TransportLot TransportLot_transportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransportLot"
    ADD CONSTRAINT "TransportLot_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES public."TransportRecord"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TransportRecord TransportRecord_createdBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."TransportRecord"
    ADD CONSTRAINT "TransportRecord_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: WarehouseIntake WarehouseIntake_transportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."WarehouseIntake"
    ADD CONSTRAINT "WarehouseIntake_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES public."TransportRecord"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict KRtw4driKs5lmaZajXk7vFXRFexKdOfbqPmqPF268Ivp5OfeYSQxzufvrDeM0LK

