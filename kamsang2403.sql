-- ชื่อโครงการ และผู้บังคับบัญชา
SELECT * from rs_process_book 
--
SELECT * from rs_file WHERE rs_doc_id = 3762
SELECT * from md_process_book
SELECT * from rs_internal_installment

-- ชื่อผู้ประสานงาน และเบอร์
SELECT * from rs_process_book_coordinator

-- ชื่อผู้ทรงคุณวุฒิ
SELECT * from rs_process_book_partners 


Select * from rs_project_partners where rs_doc_id = 4072 and md_partners_position_id = 1
select * from rs_project where rs_doc_id =4072
-- ชื่อ ผอ
SELECT personnel_name  FROM public.v_402_name
-- ชื่อ รองอธิการบดีฝ่ายวิชาการ
SELECT personnel_name  FROM v_670_name

SELECT * from mf_step WHERE mf_flow_id = 1 ORDER BY ID
SELECT * from mf_step WHERE mf_flow_id = 6 ORDER BY ID
SELECT * from mf_step WHERE mf_flow_id = 7 ORDER BY ID
SELECT * from mf_step WHERE mf_flow_id = 8 ORDER BY ID
SELECT * from mf_step WHERE mf_flow_id = 5 ORDER BY ID
 SELECT * from mf_flow ORDER by id
SELECT * from ms_attachment_type WHERE tabname = 'CollectDataInHospital'
SELECT * from ms_attachment_type WHERE tabname = 'NameAnnouncement'
SELECT * from ms_attachment_type WHERE tabname = 'BeyondAnnouncement'
SELECT * from rs_internal_installment
SELECT * from rs_project_budget

select * from rs_file where rs_doc_id = 5529


SELECT * from sf_rs_doc_sel_project_for_form('101')

select * from rs_internal_installment

SELECT a.id,b.projectnameth,d.fundname, d.id as mdfunid from rs_doc a
Left Outer Join  rs_project b on a.id = b.rs_doc_id
Left Outer Join  rs_internal c on  a.id = c.rs_doc_id
Left Outer Join  md_funding_in d on d.id = c.md_funding_in_id

where a.issaved = true  
	  and COALESCE(a.isdeleted,false) = false 
	  and a.doc_type = 'ทุนภายใน'
	  and a.personnel_id = '101' 
	  and a.mf_status_id = 90904
	  
UNION

SELECT a.id,b.projectnameth,d.fundname from rs_doc a
Left Outer Join  rs_project b on a.id = b.rs_doc_id
Left Outer Join  rs_external c on  a.id = c.rs_doc_id
Left Outer Join  md_funding_ex d on d.id = c.md_funding_ex_id
where a.issaved = true  
	  and COALESCE(a.isdeleted,false) = false 
	  and a.doc_type = 'ทุนภายนอก'
	  and a.personnel_id = '101' 
	  and a.mf_status_id = 90904